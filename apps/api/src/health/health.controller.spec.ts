import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import type { DataSource } from "typeorm";
import { HealthController } from "./health.controller";

const originalNodeEnv = process.env.NODE_ENV;
const originalRadVersion = process.env.RAD_VERSION;

beforeEach(() => {
  delete process.env.RAD_VERSION;
});

afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  if (originalRadVersion === undefined) delete process.env.RAD_VERSION;
  else process.env.RAD_VERSION = originalRadVersion;
});

function fakeDataSource(dbUp: boolean): DataSource {
  return {
    query: async () => {
      if (!dbUp) throw new Error("db down");
      return [{ "?column?": 1 }];
    },
  } as unknown as DataSource;
}

test("reports env:production when NODE_ENV=production, distinguishing a real prod boot from a dev/watch process", async () => {
  process.env.NODE_ENV = "production";
  const controller = new HealthController(fakeDataSource(true));
  const result = await controller.check();
  assert.equal(result.env, "production");
  assert.equal(result.ok, true);
  assert.equal(result.db, true);
});

test("reports env:development (not production) when NODE_ENV is unset, e.g. `nest start --watch`", async () => {
  delete process.env.NODE_ENV;
  const controller = new HealthController(fakeDataSource(true));
  const result = await controller.check();
  assert.equal(result.env, "development");
});

test("ok is false when the database ping fails, independent of env/version", async () => {
  process.env.NODE_ENV = "production";
  const controller = new HealthController(fakeDataSource(false));
  const result = await controller.check();
  assert.equal(result.ok, false);
  assert.equal(result.db, false);
});
