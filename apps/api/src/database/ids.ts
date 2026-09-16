import { createId } from "@paralleldrive/cuid2";

/** Generate a Prisma-compatible cuid-style primary key. */
export function newDbId() {
  return createId();
}
