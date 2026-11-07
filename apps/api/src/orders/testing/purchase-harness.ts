import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { ConfigService } from "@nestjs/config";
import EmbeddedPostgres from "embedded-postgres";
import type { DataSource } from "typeorm";
import { AdminService } from "../../admin/admin.service";
import { CartService } from "../../cart/cart.service";
import type { Actor } from "../../common/identity";
import { IdentityService } from "../../common/identity.service";
import { createAppDataSource } from "../../database/data-source";
import {
  CartItem,
  Favorite,
  Notice,
  Order,
  PasswordResetToken,
  PaymentIntent,
  Product,
  ProductAttribute,
  ProductAttributeCategory,
  ProductAttributeOption,
  ProductAttributeValue,
  ProductImage,
  Review,
  User,
  Vendor,
} from "../../database/entities";
import { InventoryService } from "../../inventory/inventory.service";
import { MailService } from "../../mail/mail.service";
import type { CatalogRevalidationService } from "../../catalog/catalog-revalidation.service";
import { NoticesService } from "../../notices/notices.service";
import {
  CURRENT_POLICY_VERSIONS,
  ORDER_POLICY_SLUGS,
} from "../../policies/const";
import { OrdersService } from "../orders.service";
import { PaymentReviewService } from "../payment-review.service";
import { ProductAttributesService } from "../../product-attributes/product-attributes.service";
import { CloudinaryStorageService } from "../../storage/cloudinary-storage.service";

function freePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

/** How long a single embedded-Postgres startup stage may take before we give
 * up and surface a timeout rather than hang the test run forever. */
const STARTUP_STAGE_TIMEOUT_MS = 30_000;

/** Caps how much embedded-Postgres stdout/stderr we keep around for a
 * failure message — enough to diagnose a crash, never an unbounded dump. */
const LOG_TAIL_LIMIT = 4_000;

class BoundedLogTail {
  private chunks: string[] = [];
  private length = 0;

  push(message: string) {
    this.chunks.push(message);
    this.length += message.length;
    while (this.length > LOG_TAIL_LIMIT && this.chunks.length > 1) {
      this.length -= this.chunks.shift()!.length;
    }
  }

  text() {
    const joined = this.chunks.join("");
    return joined.length > LOG_TAIL_LIMIT
      ? `…${joined.slice(-LOG_TAIL_LIMIT)}`
      : joined;
  }
}

/** Runs `fn`, and if it doesn't settle within `ms`, rejects with a
 * recognizable timeout error instead of hanging indefinitely (embedded-
 * postgres's own `start()` has no internal timeout — if the server process
 * never prints its "ready" line and never exits, the returned promise never
 * settles). */
function withStageTimeout<T>(
  stage: string,
  fn: () => Promise<T>,
  ms = STARTUP_STAGE_TIMEOUT_MS,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`timed out after ${ms}ms waiting for stage "${stage}"`));
    }, ms);
    fn().then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Real services wired to a throwaway embedded Postgres, never the `.env`
 * database. Mirrors how Nest composes them in `AppModule`.
 *
 * Startup diagnostics: embedded-postgres's own `start()` can reject with
 * `undefined` (no Error, no message) if the spawned `postgres` process exits
 * before printing its "ready" line — e.g. killed by the OOM killer or a
 * fork failure on a resource-starved CI runner. Previously this harness
 * passed `onLog`/`onError` no-ops, which threw away the only diagnostic
 * information (the server's own stdout/stderr) for exactly that failure, so
 * a `before` hook failure here showed up as a bare, unexplained rejection.
 * We now capture a bounded tail of that output and always surface it,
 * stage-labelled and chained via `cause`, on any setup failure — and clean
 * up whatever was already started rather than leaking a process/data dir
 * for the next test run to collide with.
 */
export async function startPurchaseHarness() {
  const databaseDir = mkdtempSync(path.join(tmpdir(), "rad-purchase-"));
  const logTail = new BoundedLogTail();
  const port = await freePort();
  const pg = new EmbeddedPostgres({
    databaseDir,
    user: "rad",
    password: "rad",
    port,
    persistent: false,
    onLog: (message) => logTail.push(message),
    onError: (message) => logTail.push(String(message)),
  });

  let pgStarted = false;

  async function cleanupAfterFailure() {
    // Best-effort: a failure during cleanup must never hide the original
    // setup error, and must not throw past this function.
    try {
      if (pgStarted) {
        await pg.stop();
      }
    } catch {
      // ignored — we're already failing; cleanup is best-effort.
    }
    try {
      rmSync(databaseDir, { recursive: true, force: true });
    } catch {
      // ignored, same reason.
    }
  }

  async function setupStage<T>(stage: string, fn: () => Promise<T>): Promise<T> {
    try {
      return await withStageTimeout(stage, fn);
    } catch (cause) {
      await cleanupAfterFailure();
      throw new Error(
        `purchase harness setup failed at stage "${stage}": ${
          cause instanceof Error ? cause.message : String(cause)
        }\n--- embedded-postgres log tail ---\n${logTail.text() || "(no output captured)"}`,
        { cause },
      );
    }
  }

  await setupStage("pg.initialise", () => pg.initialise());
  await setupStage("pg.start", async () => {
    await pg.start();
    pgStarted = true;
  });
  await setupStage("pg.createDatabase", () => pg.createDatabase("rad_test"));

  const dataSource: DataSource = await setupStage("dataSource.initialize", async () => {
    const ds = createAppDataSource({
      url: `postgresql://rad:rad@127.0.0.1:${port}/rad_test`,
      synchronize: true,
    } as never);
    await ds.initialize();
    return ds;
  });

  let catalogRevalidationCalls = 0;
  const catalogRevalidation: CatalogRevalidationService = {
    notifyChanged: async () => {
      catalogRevalidationCalls += 1;
    },
  } as unknown as CatalogRevalidationService;

  const repo = dataSource.getRepository.bind(dataSource);
  const identity = new IdentityService(repo(User));
  const notices = new NoticesService(repo(Notice), identity);
  const inventory = new InventoryService(dataSource);
  const mail = new MailService(new ConfigService({}));
  const cart = new CartService(repo(CartItem), identity, inventory);
  const orders = new OrdersService(
    dataSource,
    repo(Order),
    repo(CartItem),
    repo(PaymentIntent),
    identity,
    notices,
    inventory,
  );
  const paymentReview = new PaymentReviewService(
    dataSource,
    inventory,
    notices,
    mail,
  );
  const admin = new AdminService(
    dataSource,
    repo(Product),
    repo(ProductImage),
    repo(Order),
    repo(User),
    repo(Vendor),
    repo(CartItem),
    repo(Favorite),
    repo(Review),
    repo(PaymentIntent),
    repo(PasswordResetToken),
    inventory,
    paymentReview,
    orders,
    new ProductAttributesService(
      repo(ProductAttribute),
      repo(ProductAttributeOption),
      repo(ProductAttributeCategory),
      repo(ProductAttributeValue),
    ),
    new CloudinaryStorageService(new ConfigService({})),
    () => new CloudinaryStorageService(new ConfigService({})),
    mail,
    catalogRevalidation,
  );

  let productCount = 0;
  let receiptCount = 0;

  /** The versions the checkout page sends: the rules a ready-work order is placed under. */
  const acceptedPolicies: Record<string, string> = Object.fromEntries(
    ORDER_POLICY_SLUGS.map((slug) => [slug, CURRENT_POLICY_VERSIONS[slug]]),
  );

  return {
    dataSource,
    cart,
    orders,
    admin,
    inventory,
    notices,
    acceptedPolicies,

    catalogRevalidationCallCount() {
      return catalogRevalidationCalls;
    },

    buyer(name: string): Actor {
      return { user: null, guestId: `${name}-${Date.now()}-${Math.random()}` };
    },

    /** One-of-one work on sale at `price` toman. */
    async product(price = 12_500_000) {
      productCount += 1;
      const slug = `test-work-${productCount}-${Date.now()}`;
      await repo(Product).save(
        repo(Product).create({
          slug,
          name: `اثر آزمایشی ${productCount}`,
          subtitle: "تنها یک نسخه",
          tomanPrice: price,
          usdPrice: Math.round(price / 85_000),
          color: "#8a4938",
          accent: "#ead9bd",
          shape: "tall",
          category: "ceramics",
          status: "available",
          story: "اثر آزمایشی",
          details: ["تنها یک نسخه"],
          en: { name: slug, subtitle: "", story: "", details: [] },
        }),
      );
      return slug;
    },

    /** A distinct, well-formed PNG data URL each call. */
    receipt() {
      receiptCount += 1;
      const body = Buffer.from(
        `receipt-${receiptCount}-${Date.now()}`,
      ).toString("base64");
      return `data:image/png;base64,${body}`;
    },

    trackingNumber() {
      return `${Date.now()}${receiptCount}`.slice(-12);
    },

    /** Product → cart → checkout. Returns the `pending_payment` order. */
    async placeOrder(actor: Actor, slug: string) {
      await cart.add(actor, slug);
      return orders.checkout(actor, {
        name: "مشتری آزمایشی",
        phone: "09121234567",
        city: "تهران",
        address: "خیابان ولیعصر",
        acceptedPolicies,
      });
    },

    async productRow(slug: string) {
      return repo(Product).findOneOrFail({ where: { slug } });
    },

    async adminOrder(id: string) {
      const list = await admin.listOrders();
      const found = list.find((order) => order.id === id);
      if (!found) throw new Error(`Admin cannot see order ${id}`);
      return found;
    },

    async noticeKinds(actor: Actor) {
      const { notices: list } = await notices.list(actor);
      return list.map((notice) => notice.kind);
    },

    async stop() {
      await dataSource.destroy();
      await pg.stop();
      rmSync(databaseDir, { recursive: true, force: true });
    },
  };
}

export type PurchaseHarness = Awaited<ReturnType<typeof startPurchaseHarness>>;
