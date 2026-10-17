import assert from "node:assert/strict";
import { afterEach, describe, test } from "node:test";
import {
  assertSafeScriptTarget,
  isLocalDatabaseUrl,
  parseDatabaseHost,
  UnsafeDatabaseTargetError,
} from "./safe-target";

describe("parseDatabaseHost / isLocalDatabaseUrl", () => {
  test("recognizes localhost, 127.0.0.1 and ::1 as local", () => {
    assert.equal(
      isLocalDatabaseUrl("postgresql://rad:rad@localhost:5432/rad"),
      true,
    );
    assert.equal(
      isLocalDatabaseUrl("postgresql://rad:rad@127.0.0.1:5432/rad"),
      true,
    );
    assert.equal(
      isLocalDatabaseUrl("postgresql://rad:rad@[::1]:5432/rad"),
      true,
    );
  });

  test("rejects a remote host, including a Postgres-hosting PaaS", () => {
    assert.equal(
      isLocalDatabaseUrl(
        "postgresql://root:x@olympus.liara.cloud:31444/postgres",
      ),
      false,
    );
  });

  test("rejects an unparseable URL rather than treating it as local", () => {
    assert.equal(isLocalDatabaseUrl("not a url"), false);
  });

  test("parseDatabaseHost never includes the credentials portion", () => {
    const host = parseDatabaseHost(
      "postgresql://root:super-secret-password@olympus.liara.cloud:31444/postgres",
    );
    assert.equal(host, "olympus.liara.cloud");
    assert.equal(host.includes("super-secret-password"), false);
  });
});

describe("assertSafeScriptTarget", () => {
  afterEach(() => {
    delete process.env.RAD_ALLOW_REMOTE_DB_WRITE;
  });

  test("passes silently for a local database URL", () => {
    assert.doesNotThrow(() =>
      assertSafeScriptTarget(
        "test-script",
        "postgresql://rad:rad@localhost:5432/rad",
      ),
    );
  });

  test("fails closed for a remote database URL by default", () => {
    assert.throws(
      () =>
        assertSafeScriptTarget(
          "test-script",
          "postgresql://root:x@olympus.liara.cloud:31444/postgres",
        ),
      UnsafeDatabaseTargetError,
    );
  });

  test("does NOT fail closed just because NODE_ENV isn't 'production' — the host is what matters", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    try {
      assert.throws(
        () =>
          assertSafeScriptTarget(
            "test-script",
            "postgresql://root:x@olympus.liara.cloud:31444/postgres",
          ),
        UnsafeDatabaseTargetError,
      );
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  test("allows a remote host only when RAD_ALLOW_REMOTE_DB_WRITE names that exact host", () => {
    process.env.RAD_ALLOW_REMOTE_DB_WRITE = "olympus.liara.cloud";
    assert.doesNotThrow(() =>
      assertSafeScriptTarget(
        "test-script",
        "postgresql://root:x@olympus.liara.cloud:31444/postgres",
      ),
    );
  });

  test("a mismatched RAD_ALLOW_REMOTE_DB_WRITE (wrong host) still fails closed", () => {
    process.env.RAD_ALLOW_REMOTE_DB_WRITE = "some-other-host.example.com";
    assert.throws(
      () =>
        assertSafeScriptTarget(
          "test-script",
          "postgresql://root:x@olympus.liara.cloud:31444/postgres",
        ),
      UnsafeDatabaseTargetError,
    );
  });

  test("the error message names the host but never the credentials", () => {
    try {
      assertSafeScriptTarget(
        "test-script",
        "postgresql://root:super-secret-password@olympus.liara.cloud:31444/postgres",
      );
      assert.fail("expected assertSafeScriptTarget to throw");
    } catch (error) {
      const message = (error as Error).message;
      assert.match(message, /olympus\.liara\.cloud/);
      assert.equal(message.includes("super-secret-password"), false);
    }
  });
});
