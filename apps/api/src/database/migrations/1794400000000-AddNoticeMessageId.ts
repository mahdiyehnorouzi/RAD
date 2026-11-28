import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds a nullable `messageId` column to `Notice` (BUG-03). Lets a
 * `commission_message` notice point at the exact `StageMessage.id` it was
 * created for, so the customer can mark one incoming message read without
 * bulk-marking the whole conversation. Purely additive — existing rows get
 * NULL, read as "no specific message" (per-conversation notices never set
 * it) everywhere this is consumed (`notices.service.ts`).
 */
export class AddNoticeMessageId1794400000000 implements MigrationInterface {
  name = "AddNoticeMessageId1794400000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Notice" ADD "messageId" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "Notice" DROP COLUMN "messageId"`);
  }
}
