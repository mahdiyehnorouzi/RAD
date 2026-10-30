import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds the three `PaymentIntent` columns the ZarinPal gateway integration
 * (`248fc13a`, "Add ZarinPal payment gateway integration (backend)") added
 * to the entity — `gatewayAuthority`, `gatewayRefId`, `verifiedAt` — plus
 * the index on `gatewayAuthority`. That commit landed before this repo had
 * a migration runner at all (the TypeORM-CLI setup only arrived later, in
 * the product-attributes work); nobody ever generated a catch-up migration
 * for it, so production has been running code that selects these columns
 * against a database that never had them — the cause of `AdminService
 * .listOrders()` 500ing (any query touching `PaymentIntent` fails the same
 * way). Purely additive: no existing table, column, or row is touched.
 *
 * Generated via `migration:generate` by diffing the entities against a
 * scratch database carrying every other table/column already in sync
 * (confirms this is the *only* drift — nothing else appeared in the diff),
 * then hand-reviewed. Run explicitly with `npm run migration:run`, same as
 * `AddProductAttributes1792865771843`; `TYPEORM_SYNCHRONIZE` is refused in
 * production (`scripts/production/rad_release.py`'s `api_preflight()`), so
 * this is the only way these columns reach it.
 *
 * `down` DROPs the three columns and the index — safe only before any
 * gateway payment row has used them in a database admins rely on. Once
 * real ZarinPal `Authority`/`ref_id` values exist, per this repo's
 * migration philosophy (`docs/db-migration-runbook.md`), the only safe
 * "undo" is restoring the pre-migration backup, never `migration:revert`.
 */
export class AddPaymentIntentGatewayColumns1793032301266 implements MigrationInterface {
  name = "AddPaymentIntentGatewayColumns1793032301266";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "PaymentIntent" ADD "gatewayAuthority" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "PaymentIntent" ADD "gatewayRefId" text`,
    );
    await queryRunner.query(
      `ALTER TABLE "PaymentIntent" ADD "verifiedAt" TIMESTAMP WITH TIME ZONE`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e0da44590143ec8a2a87f2e33b" ON "PaymentIntent" ("gatewayAuthority") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e0da44590143ec8a2a87f2e33b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "PaymentIntent" DROP COLUMN "verifiedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "PaymentIntent" DROP COLUMN "gatewayRefId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "PaymentIntent" DROP COLUMN "gatewayAuthority"`,
    );
  }
}
