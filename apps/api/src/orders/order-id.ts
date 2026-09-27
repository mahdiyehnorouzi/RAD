import { randomInt } from "node:crypto";
import type { Repository } from "typeorm";
import type { Order } from "../database/entities";

/** Short customer-facing id (`RAD-104233`) that is not already taken. */
export async function nextOrderId(orders: Repository<Order>) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const id = `RAD-${randomInt(100_000, 1_000_000)}`;
    if (!(await orders.exists({ where: { id } }))) return id;
  }
  return `RAD-${Date.now()}`;
}
