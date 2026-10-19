/**
 * Additive, idempotent, transactional catch-up migration.
 *
 * WHY THIS EXISTS: production's actual database (verified by direct,
 * read-only inspection — 13 tables, `ProductImage` missing `storage`/
 * `objectKey`/`secureUrl`) matches EXACTLY what synchronizing this
 * repo's entities as of commit `b84d85d` ("Migrate the API from Prisma
 * to TypeORM") would produce — confirmed by actually doing that, in an
 * isolated scratch database, and diffing the result against this
 * database's current entities (see git history / PR description for the
 * exact commands). That diff is the entire, complete, verified set of
 * statements below: NOTHING here is guessed. `scripts/db-schema-diff.ts`
 * run against the SAME scratch database before and after these exact
 * statements confirmed zero remaining diff.
 *
 * SCOPE: 5 entirely new tables (ArtistApplication, ContactMessage,
 * DamageReport, HelpQuestion, ShapeQuestion — none of which existed at
 * all in the baseline), new nullable columns on 6 existing tables, two
 * new indexes beyond what's bundled with the column adds, one new unique
 * constraint, and exactly two NOT-NULL relaxations (Product.tomanPrice /
 * usdPrice, to support priceless archive-only works — never destroys or
 * narrows anything). Every statement is additive: no DROP, no TRUNCATE,
 * no data rewrite, no TypeORM `synchronize`.
 *
 * `Order.status` values written under the old business logic (e.g.
 * "payment_pending") are NOT rewritten here — that is already handled,
 * safely and idempotently, by the application itself on every boot
 * (`OrdersService.onModuleInit` -> `migrateLegacyOrderStatuses`, see
 * `apps/api/src/orders/order-status.migration.ts`). Duplicating that
 * logic here would be a second, competing path for the same job.
 *
 * SAFETY:
 *  - `assertSafeScriptTarget` (same guard every other data-touching
 *    script in this repo uses) refuses to run against anything but a
 *    local database unless you explicitly pass
 *    `RAD_ALLOW_REMOTE_DB_WRITE=<exact-hostname>`.
 *  - Preconditions run FIRST, read-only, and abort the entire script
 *    (nothing executed) if the live schema doesn't look like what this
 *    migration was written against - e.g. a column that's supposed to
 *    be new already exists with a different type than expected.
 *  - Every statement is wrapped in ONE transaction. Postgres DDL is
 *    transactional, so any failure rolls back everything, atomically -
 *    never a half-applied schema.
 *  - Every statement is idempotent (`IF NOT EXISTS`, or a `DO` block
 *    that swallows "already exists" for the one constraint that needs
 *    it) - safe to re-run after a partial success for any reason.
 *
 * Usage:
 *   npx tsx scripts/db-migrate-seaweedfs-catchup.ts            (local DB)
 *   RAD_ALLOW_REMOTE_DB_WRITE=<prod-host> DATABASE_URL=... \
 *     npx tsx scripts/db-migrate-seaweedfs-catchup.ts          (production, after review)
 */
import { createAppDataSource } from "../src/database/data-source";
import {
  assertSafeScriptTarget,
  parseDatabaseHost,
} from "../src/database/safe-target";

interface ExpectedColumn {
  table: string;
  column: string;
  /** Postgres `information_schema.columns.data_type` value expected if the column already exists. */
  expectedDataType: string;
}

/** Columns this migration is about to ADD. If one of these already exists, it must have exactly this type, or we abort rather than guess which definition is "right". */
const NEW_COLUMNS: ExpectedColumn[] = [
  { table: "PaymentIntent", column: "receiptHash", expectedDataType: "text" },
  {
    table: "PaymentIntent",
    column: "trackingNumber",
    expectedDataType: "text",
  },
  {
    table: "PaymentIntent",
    column: "receiptSubmissions",
    expectedDataType: "integer",
  },
  {
    table: "PaymentIntent",
    column: "reviewedAt",
    expectedDataType: "timestamp with time zone",
  },
  { table: "PaymentIntent", column: "reviewedBy", expectedDataType: "text" },
  {
    table: "PaymentIntent",
    column: "rejectionReason",
    expectedDataType: "text",
  },
  {
    table: "Order",
    column: "paymentDueAt",
    expectedDataType: "timestamp with time zone",
  },
  {
    table: "Order",
    column: "deliveredAt",
    expectedDataType: "timestamp with time zone",
  },
  { table: "Order", column: "policyVersions", expectedDataType: "jsonb" },
  {
    table: "Order",
    column: "policiesAcceptedAt",
    expectedDataType: "timestamp with time zone",
  },
  { table: "ProductImage", column: "storage", expectedDataType: "text" },
  { table: "ProductImage", column: "objectKey", expectedDataType: "text" },
  { table: "ProductImage", column: "secureUrl", expectedDataType: "text" },
  { table: "Review", column: "hidden", expectedDataType: "boolean" },
  { table: "Product", column: "radNumber", expectedDataType: "integer" },
  { table: "Product", column: "year", expectedDataType: "integer" },
  { table: "Product", column: "materials", expectedDataType: "jsonb" },
  { table: "Product", column: "dimensions", expectedDataType: "jsonb" },
  { table: "Product", column: "care", expectedDataType: "jsonb" },
  { table: "Product", column: "owner", expectedDataType: "jsonb" },
  { table: "Product", column: "passport", expectedDataType: "jsonb" },
  { table: "Product", column: "difference", expectedDataType: "jsonb" },
  {
    table: "Product",
    column: "holdExpiresAt",
    expectedDataType: "timestamp with time zone",
  },
  { table: "Product", column: "heldBy", expectedDataType: "text" },
  { table: "CartItem", column: "tomanPriceAtAdd", expectedDataType: "integer" },
  { table: "CartItem", column: "usdPriceAtAdd", expectedDataType: "integer" },
];

/** Columns this migration RELAXES (drops NOT NULL). Must already exist as NOT NULL integer, or we abort. */
const RELAXED_COLUMNS: ExpectedColumn[] = [
  { table: "Product", column: "tomanPrice", expectedDataType: "integer" },
  { table: "Product", column: "usdPrice", expectedDataType: "integer" },
];

const NEW_TABLES = [
  "ArtistApplication",
  "ContactMessage",
  "DamageReport",
  "HelpQuestion",
  "ShapeQuestion",
];

const NEW_TABLE_DDL: string[] = [
  `CREATE TABLE IF NOT EXISTS "ArtistApplication" ("id" text NOT NULL, "ownerKey" text, "fullName" text NOT NULL, "artistName" text, "contact" text NOT NULL, "city" text NOT NULL, "instagram" text, "artworkImages" text NOT NULL, "about" text, "categories" text NOT NULL, "shippingMethod" text NOT NULL, "availability" text, "status" text NOT NULL DEFAULT 'submitted', "reviewNote" text, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_e6221cd1422618e413056991cb7" PRIMARY KEY ("id"))`,
  `CREATE INDEX IF NOT EXISTS "IDX_0c4fb83f8806250ddda5dbf6d4" ON "ArtistApplication" ("status")`,
  `CREATE TABLE IF NOT EXISTS "ContactMessage" ("id" text NOT NULL, "ownerKey" text NOT NULL, "userId" text, "orderId" text, "fromOrderOwner" boolean NOT NULL DEFAULT false, "topic" text NOT NULL, "source" text NOT NULL, "name" text NOT NULL DEFAULT '', "contact" text NOT NULL, "body" text NOT NULL, "parentId" text, "fromAdmin" boolean NOT NULL DEFAULT false, "status" text NOT NULL DEFAULT 'new', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "resolvedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_af24516e855a17ce31a4d587bd9" PRIMARY KEY ("id"))`,
  `CREATE INDEX IF NOT EXISTS "IDX_af0aec10d90281c83784d2ceee" ON "ContactMessage" ("ownerKey")`,
  `CREATE INDEX IF NOT EXISTS "IDX_325ff6da5eb3fefdbbff066732" ON "ContactMessage" ("orderId")`,
  `CREATE INDEX IF NOT EXISTS "IDX_8ec9d50cecb52cc6653b4b73ea" ON "ContactMessage" ("parentId")`,
  `CREATE INDEX IF NOT EXISTS "IDX_617f6c75d936a81047e0c914ee" ON "ContactMessage" ("status")`,
  `CREATE TABLE IF NOT EXISTS "DamageReport" ("id" text NOT NULL, "orderId" text NOT NULL, "ownerKey" text NOT NULL, "userId" text, "packagingPhoto" text NOT NULL, "damagePhoto" text NOT NULL, "body" text NOT NULL, "status" text NOT NULL DEFAULT 'submitted', "resolution" text, "note" text, "late" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "reviewedAt" TIMESTAMP WITH TIME ZONE, "reviewedBy" text, CONSTRAINT "PK_7a35e2e51f2b0cf7468beb0dcbf" PRIMARY KEY ("id"))`,
  `CREATE INDEX IF NOT EXISTS "IDX_1c253792954af56ab88ab773f1" ON "DamageReport" ("orderId")`,
  `CREATE INDEX IF NOT EXISTS "IDX_1a2cd79de0caf04b0a97c97e4b" ON "DamageReport" ("ownerKey")`,
  `CREATE INDEX IF NOT EXISTS "IDX_019229fc6703ef0b9d81e1b893" ON "DamageReport" ("status")`,
  `CREATE TABLE IF NOT EXISTS "HelpQuestion" ("id" text NOT NULL, "question" jsonb NOT NULL, "answer" jsonb NOT NULL, "moreSlug" text, "moreSection" text, "position" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_03573f999ab9fc08a7b2d542468" PRIMARY KEY ("id"))`,
  `CREATE TABLE IF NOT EXISTS "ShapeQuestion" ("id" text NOT NULL, "trait" text NOT NULL, "prompt" jsonb NOT NULL, "hint" jsonb NOT NULL, "choices" jsonb NOT NULL, "position" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_c198a493fdea5e3bf6d1923a90b" PRIMARY KEY ("id"))`,
];

const COLUMN_ADD_DDL: string[] = [
  `ALTER TABLE "PaymentIntent" ADD COLUMN IF NOT EXISTS "receiptHash" text`,
  `ALTER TABLE "PaymentIntent" ADD COLUMN IF NOT EXISTS "trackingNumber" text`,
  `ALTER TABLE "PaymentIntent" ADD COLUMN IF NOT EXISTS "receiptSubmissions" integer NOT NULL DEFAULT '0'`,
  `ALTER TABLE "PaymentIntent" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP WITH TIME ZONE`,
  `ALTER TABLE "PaymentIntent" ADD COLUMN IF NOT EXISTS "reviewedBy" text`,
  `ALTER TABLE "PaymentIntent" ADD COLUMN IF NOT EXISTS "rejectionReason" text`,
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentDueAt" TIMESTAMP WITH TIME ZONE`,
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveredAt" TIMESTAMP WITH TIME ZONE`,
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "policyVersions" jsonb`,
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "policiesAcceptedAt" TIMESTAMP WITH TIME ZONE`,
  `ALTER TABLE "ProductImage" ADD COLUMN IF NOT EXISTS "storage" text`,
  `ALTER TABLE "ProductImage" ADD COLUMN IF NOT EXISTS "objectKey" text`,
  `ALTER TABLE "ProductImage" ADD COLUMN IF NOT EXISTS "secureUrl" text`,
  `ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "hidden" boolean NOT NULL DEFAULT false`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "radNumber" integer`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "year" integer`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "materials" jsonb`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "dimensions" jsonb`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "care" jsonb`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "owner" jsonb`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "passport" jsonb`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "difference" jsonb`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "holdExpiresAt" TIMESTAMP WITH TIME ZONE`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "heldBy" text`,
  `ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "tomanPriceAtAdd" integer`,
  `ALTER TABLE "CartItem" ADD COLUMN IF NOT EXISTS "usdPriceAtAdd" integer`,
];

/** `ADD CONSTRAINT` has no `IF NOT EXISTS` in Postgres - this is the standard idiom. Name is TypeORM's own deterministic hash of table+columns, so it matches exactly what `synchronize` would generate (and what db-schema-diff.ts will therefore see as "already satisfied"). */
const CONSTRAINT_ADD_DDL = `
DO $$ BEGIN
  ALTER TABLE "Product" ADD CONSTRAINT "UQ_6e2c5464a2bc5f16d13fd619daa" UNIQUE ("radNumber");
EXCEPTION
  -- A UNIQUE constraint is backed by an index; re-adding one that already
  -- exists raises 42P07 (duplicate_table), not duplicate_object, because
  -- Postgres is complaining about the backing index/relation name, not
  -- the constraint itself. Both are caught so this is actually idempotent
  -- on re-run, not just transactionally safe to fail on re-run.
  WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;`;

const INDEX_ADD_DDL: string[] = [
  `CREATE INDEX IF NOT EXISTS "IDX_dd689c4f4a7fa6a9d3d14f1f64" ON "PaymentIntent" ("receiptHash")`,
  `CREATE INDEX IF NOT EXISTS "IDX_fe122fb903cdf01252bc4144b7" ON "PaymentIntent" ("trackingNumber")`,
  `CREATE INDEX IF NOT EXISTS "IDX_8a2a38faa1708165e53e23c2fa" ON "Order" ("status")`,
  `CREATE INDEX IF NOT EXISTS "IDX_4fc14d808db85fc886ca790ec6" ON "Product" ("status")`,
  `CREATE INDEX IF NOT EXISTS "IDX_b605ed5e73fd39e7dc0c042a31" ON "Product" ("holdExpiresAt")`,
];

/** Relaxations/default changes - never destroys data, only loosens a constraint or changes what NEW rows default to. */
const RELAX_AND_DEFAULT_DDL: string[] = [
  `ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'pending_payment'`,
  `ALTER TABLE "Product" ALTER COLUMN "tomanPrice" DROP NOT NULL`,
  `ALTER TABLE "Product" ALTER COLUMN "usdPrice" DROP NOT NULL`,
  `ALTER TABLE "Product" ALTER COLUMN "status" SET DEFAULT 'draft'`,
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("ERROR: DATABASE_URL is not set.");
    process.exit(2);
  }
  assertSafeScriptTarget("db-migrate-seaweedfs-catchup", url);
  const host = parseDatabaseHost(url!);
  console.log(`Target host: ${host}`);

  const ds = createAppDataSource({
    url,
    synchronize: false,
    logging: false,
  } as never);
  await ds.initialize();

  try {
    console.log("\n=== Preflight (read-only) ===");
    const existingTables: Set<string> = new Set(
      (
        await ds.query(
          `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`,
        )
      ).map((r: { table_name: string }) => r.table_name),
    );
    for (const table of NEW_TABLES) {
      if (existingTables.has(table)) {
        console.log(
          `  [notice] "${table}" already exists - CREATE TABLE IF NOT EXISTS will no-op for it, columns not re-verified here.`,
        );
      } else {
        console.log(`  [ok] "${table}" does not exist yet - will be created.`);
      }
    }

    const columnRows: {
      table_name: string;
      column_name: string;
      data_type: string;
    }[] = await ds.query(
      `SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public'`,
    );
    const columnType = new Map<string, string>();
    for (const row of columnRows) {
      columnType.set(`${row.table_name}.${row.column_name}`, row.data_type);
    }

    let abort = false;
    for (const { table, column, expectedDataType } of NEW_COLUMNS) {
      const key = `${table}.${column}`;
      const actual = columnType.get(key);
      if (actual === undefined) {
        console.log(
          `  [ok] ${key} does not exist yet - will be added as ${expectedDataType}.`,
        );
      } else if (actual === expectedDataType) {
        console.log(
          `  [ok] ${key} already exists as ${actual} (matches) - ADD COLUMN IF NOT EXISTS will no-op.`,
        );
      } else {
        console.log(
          `  [ABORT] ${key} already exists as "${actual}", expected "${expectedDataType}". Refusing to guess which is right.`,
        );
        abort = true;
      }
    }
    for (const { table, column, expectedDataType } of RELAXED_COLUMNS) {
      const key = `${table}.${column}`;
      const actual = columnType.get(key);
      if (actual !== expectedDataType) {
        console.log(
          `  [ABORT] ${key} is "${actual ?? "MISSING"}", expected "${expectedDataType}" before relaxing its NOT NULL constraint.`,
        );
        abort = true;
      } else {
        console.log(
          `  [ok] ${key} is ${actual} as expected - safe to drop NOT NULL.`,
        );
      }
    }

    if (abort) {
      console.error(
        "\nPreflight found unexpected schema state. ABORTING - nothing was executed.",
      );
      process.exit(1);
    }
    console.log(
      "\nPreflight passed. Proceeding inside a single transaction...",
    );

    await ds.transaction(async (manager) => {
      for (const sql of NEW_TABLE_DDL) await manager.query(sql);
      for (const sql of COLUMN_ADD_DDL) await manager.query(sql);
      await manager.query(CONSTRAINT_ADD_DDL);
      for (const sql of INDEX_ADD_DDL) await manager.query(sql);
      for (const sql of RELAX_AND_DEFAULT_DDL) await manager.query(sql);
    });

    console.log("\nMigration committed successfully.");
    console.log(
      "Run scripts/db-schema-diff.ts now to verify zero remaining diff.",
    );
  } finally {
    await ds.destroy();
  }
}

main().catch((error) => {
  console.error("Migration FAILED and was rolled back (transactional):", error);
  process.exit(1);
});
