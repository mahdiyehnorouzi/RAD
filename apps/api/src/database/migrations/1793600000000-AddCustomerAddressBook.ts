import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds `CustomerAddress` for the signed-in customer's delivery address book.
 * Existing `Order` rows are not read or written: checkout still stores its
 * own name, city, phone, and address snapshot.
 *
 * `isDefault` allows many false rows and at most one true row per user.
 * Deleting a user removes that user's addresses (`ON DELETE CASCADE`).
 *
 * `down` drops only this table. Safe before customers rely on saved
 * addresses. After that, restore a backup instead of reverting.
 */
export class AddCustomerAddressBook1793600000000 implements MigrationInterface {
  name = "AddCustomerAddressBook1793600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "CustomerAddress" (
        "id" text NOT NULL,
        "userId" text NOT NULL,
        "recipientName" text NOT NULL,
        "phone" text NOT NULL,
        "provinceId" text NOT NULL,
        "cityId" text NOT NULL,
        "provinceLabel" text NOT NULL,
        "cityLabel" text NOT NULL,
        "address" text NOT NULL,
        "postalCode" text,
        "isDefault" boolean NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_CustomerAddress" PRIMARY KEY ("id"),
        CONSTRAINT "FK_CustomerAddress_user" FOREIGN KEY ("userId")
          REFERENCES "User"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_CustomerAddress_userId" ON "CustomerAddress" ("userId")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_CustomerAddress_default" ON "CustomerAddress" ("userId") WHERE "isDefault" = true`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "public"."CustomerAddress"`);
  }
}
