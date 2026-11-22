import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Stores the buyer's shipping method and the toman fee the server quoted.
 * Existing rows keep a null method and a 0 fee; their `total` is unchanged.
 */
export class AddOrderShipping1794100000000 implements MigrationInterface {
  name = "AddOrderShipping1794100000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Order" ADD "shippingMethod" text`);
    await queryRunner.query(
      `ALTER TABLE "Order" ADD "shippingFee" integer NOT NULL DEFAULT 0`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Order" DROP COLUMN "shippingFee"`);
    await queryRunner.query(`ALTER TABLE "Order" DROP COLUMN "shippingMethod"`);
  }
}
