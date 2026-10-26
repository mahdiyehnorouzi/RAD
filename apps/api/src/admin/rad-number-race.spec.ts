import assert from "node:assert/strict";
import { test } from "node:test";
import { QueryFailedError } from "typeorm";
import { AdminService } from "./admin.service";

/**
 * Pure, no-DB coverage for `createProductWithRadNumber`'s retry: two
 * concurrent "create product" saves can read the same `MAX(radNumber)`
 * before either insert commits (see `rad-number.ts`'s own doc comment).
 * The DB's unique constraint rejects the loser's insert rather than
 * duplicating the number - this is what turns that rejection into a
 * transparent retry instead of a failed save.
 */
/** Only `products` matters for `createProductWithRadNumber`; everything else is unused. */
function adminServiceWithProductsRepo(products: unknown) {
  return new AdminService(
    null as never,
    products as never,
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
    null as never,
  ) as unknown as {
    createProductWithRadNumber: (
      product: Record<string, unknown>,
      attempt?: number,
    ) => Promise<{ radNumber: number }>;
  };
}

function fakeProductsRepo(nextMax: () => number) {
  let saveAttempts = 0;
  return {
    createQueryBuilder: () => ({
      select: () => ({
        getRawOne: async () => ({ max: nextMax() }),
      }),
    }),
    create: (input: unknown) => input,
    save: async (input: { radNumber: number }) => {
      saveAttempts += 1;
      // Simulate the race: the first attempt's radNumber collides with a
      // row another concurrent request just committed.
      if (saveAttempts === 1) {
        throw new QueryFailedError(
          "INSERT INTO product ...",
          [],
          Object.assign(new Error("duplicate key value"), {
            code: "23505",
            detail: `Key (radNumber)=(${input.radNumber}) already exists.`,
          }),
        );
      }
      return input;
    },
  };
}

test("a radNumber collision on create retries with a fresh number instead of failing the save", async () => {
  const service = adminServiceWithProductsRepo(fakeProductsRepo(() => 41));
  const result = await service.createProductWithRadNumber({
    slug: "test-work",
  });
  assert.equal(result.radNumber, 42);
});

test("a non-radNumber save failure is never swallowed as a retry", async () => {
  const service = adminServiceWithProductsRepo({
    createQueryBuilder: () => ({
      select: () => ({ getRawOne: async () => ({ max: 1 }) }),
    }),
    create: (input: unknown) => input,
    save: async () => {
      throw new Error("connection reset");
    },
  });
  await assert.rejects(
    () => service.createProductWithRadNumber({ slug: "test-work" }),
    /connection reset/,
  );
});
