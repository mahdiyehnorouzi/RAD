import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds a nullable `message` column to `Order` for the optional
 * "Message to RAD" note a buyer can leave at checkout (RAD-060). Purely
 * additive — existing rows get NULL, read as "no message" everywhere this
 * is consumed (`order.mapper.ts`, `admin.mapper.ts`).
 */
export class AddOrderMessage1793900000000 implements MigrationInterface {
  name = "AddOrderMessage1793900000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Order" ADD "message" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Order" DROP COLUMN "message"`);
  }
}
