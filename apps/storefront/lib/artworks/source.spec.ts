import { test, mock } from "node:test";
import assert from "node:assert/strict";

// "server-only" throws when loaded outside Next's Server Component build
// (see its own index.js) — stub it so this file, and the modules it
// imports, can run under the plain node:test runner.
mock.module("server-only", { defaultExport: undefined, namedExports: {} });

const { catalogSource, registryFallbackAllowed } = await import("./source");

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) previous[key] = process.env[key];
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("catalogSource always returns 'api' in production, even when CATALOG_SOURCE requests the registry", () => {
  withEnv({ NODE_ENV: "production", CATALOG_SOURCE: "registry" }, () => {
    assert.equal(catalogSource(), "api");
  });
  withEnv({ NODE_ENV: "production", CATALOG_SOURCE: "auto" }, () => {
    assert.equal(catalogSource(), "api");
  });
  withEnv({ NODE_ENV: "production", CATALOG_SOURCE: undefined }, () => {
    assert.equal(catalogSource(), "api");
  });
});

test("catalogSource respects CATALOG_SOURCE outside production", () => {
  withEnv({ NODE_ENV: "development", CATALOG_SOURCE: "registry" }, () => {
    assert.equal(catalogSource(), "registry");
  });
  withEnv({ NODE_ENV: "development", CATALOG_SOURCE: "api" }, () => {
    assert.equal(catalogSource(), "api");
  });
  withEnv({ NODE_ENV: "development", CATALOG_SOURCE: undefined }, () => {
    assert.equal(catalogSource(), "auto");
  });
});

test("registryFallbackAllowed is false in production and true otherwise", () => {
  withEnv({ NODE_ENV: "production" }, () => {
    assert.equal(registryFallbackAllowed(), false);
  });
  withEnv({ NODE_ENV: "development" }, () => {
    assert.equal(registryFallbackAllowed(), true);
  });
  withEnv({ NODE_ENV: "test" }, () => {
    assert.equal(registryFallbackAllowed(), true);
  });
});
