import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderGiftDelivery1794200000000 implements MigrationInterface {
  name = "AddOrderGiftDelivery1794200000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Order"
      ADD "recipientName" text,
      ADD "recipientPhone" text,
      ADD "giftMessage" text`);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Order"
      DROP COLUMN "giftMessage",
      DROP COLUMN "recipientPhone",
      DROP COLUMN "recipientName"`);
  }
}
