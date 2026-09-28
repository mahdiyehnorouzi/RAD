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
  PaymentIntent,
  Product,
  ProductImage,
  Review,
  User,
  Vendor,
} from "../../database/entities";
import { InventoryService } from "../../inventory/inventory.service";
import { MailService } from "../../mail/mail.service";
import { NoticesService } from "../../notices/notices.service";
import { CURRENT_POLICY_VERSIONS, ORDER_POLICY_SLUGS } from "../../policies/const";
import { OrdersService } from "../orders.service";
import { PaymentReviewService } from "../payment-review.service";

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

/**
 * Real services wired to a throwaway embedded Postgres, never the `.env`
 * database. Mirrors how Nest composes them in `AppModule`.
 */
export async function startPurchaseHarness() {
  const databaseDir = mkdtempSync(path.join(tmpdir(), "rad-purchase-"));
  const port = await freePort();
  const pg = new EmbeddedPostgres({
    databaseDir,
    user: "rad",
    password: "rad",
    port,
    persistent: false,
    onLog: () => {},
    onError: () => {},
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("rad_test");

  const dataSource: DataSource = createAppDataSource({
    url: `postgresql://rad:rad@127.0.0.1:${port}/rad_test`,
    synchronize: true,
  } as never);
  await dataSource.initialize();

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
    inventory,
    paymentReview,
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
      const body = Buffer.from(`receipt-${receiptCount}-${Date.now()}`).toString(
        "base64",
      );
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
