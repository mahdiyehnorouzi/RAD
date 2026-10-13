import assert from "node:assert/strict";
import { test } from "node:test";
import { POOL_EXTRA, typeOrmOptions } from "./data-source";

test("pool config caps the pool and self-terminates a stuck transaction", () => {
  assert.equal(POOL_EXTRA.max, 5, "conservative per-process connection cap");
  assert.equal(
    POOL_EXTRA.idle_in_transaction_session_timeout,
    30_000,
    "a connection abandoned mid-transaction must not hold its pool slot forever",
  );
  assert.equal(POOL_EXTRA.statement_timeout, 30_000);
});

test("database.module.ts and data-source.ts cannot drift: both build off the same extra", () => {
  const options = typeOrmOptions() as { extra: typeof POOL_EXTRA };
  assert.deepEqual(options.extra, POOL_EXTRA);
});
