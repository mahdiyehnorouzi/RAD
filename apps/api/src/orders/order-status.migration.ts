import type { Logger } from "@nestjs/common";
import { In, type DataSource } from "typeorm";
import { Order } from "../database/entities";
import { LEGACY_ORDER_STATUS } from "./const";

/**
 * Rewrites statuses stored before payment verification was its own step.
 * Orders whose receipt was already uploaded land in `pending_verification`.
 */
export async function migrateLegacyOrderStatuses(
  dataSource: DataSource,
  logger: Logger,
) {
  const verifying = await dataSource.query(
    `UPDATE "Order" o SET status = 'pending_verification', "paymentDueAt" = NULL
       FROM "PaymentIntent" p
      WHERE p."orderId" = o.id AND o.status = 'payment_pending' AND p.status = 'submitted'`,
  );
  const moved = Array.isArray(verifying) ? Number(verifying[1] ?? 0) : 0;
  if (moved) {
    logger.log(`Moved ${moved} order(s) with a receipt to pending_verification.`);
  }

  const orders = dataSource.getRepository(Order);
  const legacy = Object.keys(LEGACY_ORDER_STATUS);
  const rows = await orders.find({
    where: { status: In(legacy) },
    select: { id: true, status: true },
  });
  for (const row of rows) {
    await orders.update(
      { id: row.id },
      {
        status:
          LEGACY_ORDER_STATUS[row.status as keyof typeof LEGACY_ORDER_STATUS],
      },
    );
  }
  if (rows.length) {
    logger.log(`Migrated ${rows.length} order(s) from legacy statuses.`);
  }
}
