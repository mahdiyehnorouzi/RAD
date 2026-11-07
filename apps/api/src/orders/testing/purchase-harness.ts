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
import {
  describe,
  runCleanupStep,
  runStageWithTimeout,
  SpawnedProcessTracker,
  type ProcessHandle,
} from "./startup-lifecycle";

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

/** The subset of `EmbeddedPostgres` this harness actually uses — lets tests
 * inject a fake that never touches a real Postgres binary. `process` is not
 * part of the package's public `.d.ts` (see `embedded-postgres.d.ts`'s own
 * comment on that), but the real implementation sets it synchronously as
 * soon as it spawns the server, which is exactly what `SpawnedProcessTracker`
 * polls for. */
interface EmbeddedPostgresLike {
  initialise(): Promise<void>;
  start(): Promise<void>;
  createDatabase(name: string): Promise<void>;
  stop(): Promise<void>;
  process?: ProcessHandle;
}

export interface PurchaseHarnessOverrides {
  createEmbeddedPostgres?: (options: {
    databaseDir: string;
    user: string;
    password: string;
    port: number;
    persistent: boolean;
    onLog: (message: string) => void;
    onError: (message: unknown) => void;
  }) => EmbeddedPostgresLike;
  /** Only ever reached by `dataSource.initialize` and only needs to satisfy
   * `initialize`/`destroy` for a test that fails before any repository is
   * touched — never given its full `DataSource` surface by a fake. */
  createDataSource?: (url: string) => DataSource;
  /** Defaults to `STARTUP_STAGE_TIMEOUT_MS` (30s) — overridable so tests can
   * exercise the timeout path deterministically in milliseconds, not
   * minutes. */
  stageTimeoutMs?: number;
  /** Defaults to 5s — overridable for the same reason as `stageTimeoutMs`. */
  cleanupTimeoutMs?: number;
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
export async function startPurchaseHarness(
  overrides: PurchaseHarnessOverrides = {},
) {
  const databaseDir = mkdtempSync(path.join(tmpdir(), "rad-purchase-"));
  const logTail = new BoundedLogTail();
  const port = await freePort();

  const createEmbeddedPostgres =
    overrides.createEmbeddedPostgres ??
    ((options) =>
      new EmbeddedPostgres(options) as unknown as EmbeddedPostgresLike);
  const createDataSource =
    overrides.createDataSource ??
    ((url) =>
      createAppDataSource({ url, synchronize: true } as never) as DataSource);

  const pg = createEmbeddedPostgres({
    databaseDir,
    user: "rad",
    password: "rad",
    port,
    persistent: false,
    onLog: (message) => logTail.push(message),
    onError: (message) => logTail.push(String(message)),
  });

  // Tracks the real OS process independently of whether `pg.start()`'s own
  // promise has resolved — it only resolves once Postgres reports ready,
  // but the process can be alive well before that, or need killing after a
  // stage has already timed out waiting on it. Watches continuously from
  // here so a late spawn is still caught even if the stage that triggered
  // it already failed.
  const processTracker = new SpawnedProcessTracker();
  processTracker.watch(() => pg.process);

  // Set as soon as the DataSource object exists — even if `initialize()`
  // itself is still pending or times out — so cleanup can still `destroy()`
  // it rather than leaking an open connection attempt.
  let dataSource: DataSource | undefined;

  async function cleanupAfterFailure(): Promise<string[]> {
    processTracker.stopWatching();
    const notes: string[] = [];
    // Order matters: stop the real process (confirmed exited, not just
    // asked to exit) BEFORE touching the data directory it may still be
    // writing to, and before destroying the DataSource that may still hold
    // an open connection to it.
    const cleanupTimeoutMs = overrides.cleanupTimeoutMs ?? 5_000;
    // `processTracker.terminate()` keeps its own longer internal grace
    // period (it always resolves, never throws) — the OUTER bound here is
    // what actually turns "the process won't die" into a reported cleanup
    // failure, rather than silently waiting on it.
    const terminateNote = await runCleanupStep(
      "terminate postgres process",
      () => processTracker.terminate(),
      cleanupTimeoutMs,
    );
    if (terminateNote) notes.push(terminateNote);

    if (dataSource) {
      const destroyNote = await runCleanupStep(
        "destroy DataSource",
        () => dataSource!.destroy(),
        cleanupTimeoutMs,
      );
      if (destroyNote) notes.push(destroyNote);
    }

    try {
      rmSync(databaseDir, { recursive: true, force: true });
    } catch (error) {
      notes.push(`remove data directory failed: ${describe(error)}`);
    }
    return notes;
  }

  async function setupStage<T>(
    stage: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    try {
      return await runStageWithTimeout(stage, fn, {
        timeoutMs: overrides.stageTimeoutMs ?? STARTUP_STAGE_TIMEOUT_MS,
        onLateSettlement: (info) => {
          // The underlying operation settled after we'd already given up
          // on it (and, by the time this fires, likely already started or
          // finished cleanup). Record it — it must never become an
          // unhandled rejection, and must never be treated as "the harness
          // is now usable after all".
          logTail.push(
            `[late settlement, after "${info.stage}" had already timed out] ${info.outcome}: ${describe(info.value)}\n`,
          );
        },
      });
    } catch (cause) {
      const cleanupNotes = await cleanupAfterFailure();
      const cleanupSection = cleanupNotes.length
        ? `\n--- cleanup diagnostics (secondary; see cause above for the real failure) ---\n${cleanupNotes.join("\n")}`
        : "";
      throw new Error(
        `purchase harness setup failed at stage "${stage}": ${describe(cause)}\n--- embedded-postgres log tail ---\n${logTail.text() || "(no output captured)"}${cleanupSection}`,
        { cause },
      );
    }
  }

  await setupStage("pg.initialise", () => pg.initialise());
  await setupStage("pg.start", () => pg.start());
  await setupStage("pg.createDatabase", () => pg.createDatabase("rad_test"));

  const initializedDataSource: DataSource = await setupStage(
    "dataSource.initialize",
    async () => {
      const ds = createDataSource(
        `postgresql://rad:rad@127.0.0.1:${port}/rad_test`,
      );
      dataSource = ds;
      await ds.initialize();
      return ds;
    },
  );

  // Setup succeeded: ordinary `.stop()` below takes over from here, and we
  // no longer need to independently watch for the process (it's known-good
  // and tracked by `pg` itself from this point on).
  processTracker.stopWatching();

  let catalogRevalidationCalls = 0;
  const catalogRevalidation: CatalogRevalidationService = {
    notifyChanged: async () => {
      catalogRevalidationCalls += 1;
    },
  } as unknown as CatalogRevalidationService;

  const repo = initializedDataSource.getRepository.bind(initializedDataSource);
  const identity = new IdentityService(repo(User));
  const notices = new NoticesService(repo(Notice), identity);
  const inventory = new InventoryService(initializedDataSource);
  const mail = new MailService(new ConfigService({}));
  const cart = new CartService(repo(CartItem), identity, inventory);
  const orders = new OrdersService(
    initializedDataSource,
    repo(Order),
    repo(CartItem),
    repo(PaymentIntent),
    identity,
    notices,
    inventory,
  );
  const paymentReview = new PaymentReviewService(
    initializedDataSource,
    inventory,
    notices,
    mail,
  );
  const admin = new AdminService(
    initializedDataSource,
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
    dataSource: initializedDataSource,
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
      await initializedDataSource.destroy();
      await pg.stop();
      rmSync(databaseDir, { recursive: true, force: true });
    },
  };
}

export type PurchaseHarness = Awaited<ReturnType<typeof startPurchaseHarness>>;
