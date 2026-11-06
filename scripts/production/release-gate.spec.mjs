import assert from "node:assert/strict";
import { test } from "node:test";
import { affectedServices, verifyCommit } from "./release-gate.mjs";

test("docs-only change affects nothing", () => {
  const result = affectedServices(["docs/cicd-pipeline.md", "README.md"]);
  assert.deepEqual(result, {
    api: false,
    storefront: false,
    admin: false,
    any: false,
  });
});

test("apps/api change affects only api", () => {
  const result = affectedServices(["apps/api/src/orders/orders.service.ts"]);
  assert.deepEqual(result, {
    api: true,
    storefront: false,
    admin: false,
    any: true,
  });
});

test("packages/artworks change affects api and storefront, not admin", () => {
  const result = affectedServices(["packages/artworks/src/index.ts"]);
  assert.deepEqual(result, {
    api: true,
    storefront: true,
    admin: false,
    any: true,
  });
});

test("packages/types change affects storefront and admin, not api", () => {
  const result = affectedServices(["packages/types/src/order-status.ts"]);
  assert.deepEqual(result, {
    api: false,
    storefront: true,
    admin: true,
    any: true,
  });
});

test("packages/i18n change affects only storefront", () => {
  const result = affectedServices(["packages/i18n/src/fa.ts"]);
  assert.deepEqual(result, {
    api: false,
    storefront: true,
    admin: false,
    any: true,
  });
});

test("root package-lock.json change is conservative: affects all three", () => {
  const result = affectedServices(["package-lock.json"]);
  assert.deepEqual(result, {
    api: true,
    storefront: true,
    admin: true,
    any: true,
  });
});

test("editing this workflow's own deploy files is conservative: affects all three", () => {
  const result = affectedServices([".github/workflows/deploy-api-vps.yml"]);
  assert.deepEqual(result, {
    api: true,
    storefront: true,
    admin: true,
    any: true,
  });
});

test("a mix of an affecting and a non-affecting path still affects the matched service", () => {
  const result = affectedServices([
    "docs/README.md",
    "apps/admin/app/page.tsx",
  ]);
  assert.deepEqual(result, {
    api: false,
    storefront: false,
    admin: true,
    any: true,
  });
});

test("verifyCommit refuses a short or non-hex commit_sha before shelling out", () => {
  const exec = () => {
    throw new Error("must not be called for an invalid SHA");
  };
  const result = verifyCommit({
    repo: "mahdiyehnorouzi/RAD",
    commitSha: "abc123",
    requiredCheck: "CI passed",
    exec,
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /not a full 40-character SHA/);
});

test("verifyCommit refuses a commit that is not an ancestor of origin/main", () => {
  const sha = "a".repeat(40);
  const exec = (cmd) => {
    if (cmd === "git") {
      throw new Error("not an ancestor");
    }
    throw new Error(`unexpected call: ${cmd}`);
  };
  const result = verifyCommit({
    repo: "mahdiyehnorouzi/RAD",
    commitSha: sha,
    requiredCheck: "CI passed",
    exec,
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /is not an ancestor of origin\/main/);
});

test("verifyCommit refuses when the required check run is missing", () => {
  const sha = "b".repeat(40);
  const exec = (cmd) => {
    if (cmd === "git") return "";
    if (cmd === "gh")
      return JSON.stringify([
        { name: "Lint", status: "completed", conclusion: "success" },
      ]);
    throw new Error(`unexpected call: ${cmd}`);
  };
  const result = verifyCommit({
    repo: "mahdiyehnorouzi/RAD",
    commitSha: sha,
    requiredCheck: "CI passed",
    exec,
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /no "CI passed" check run found/);
});

test("verifyCommit refuses when the required check run did not succeed", () => {
  const sha = "c".repeat(40);
  const exec = (cmd) => {
    if (cmd === "git") return "";
    if (cmd === "gh")
      return JSON.stringify([
        { name: "CI passed", status: "completed", conclusion: "failure" },
      ]);
    throw new Error(`unexpected call: ${cmd}`);
  };
  const result = verifyCommit({
    repo: "mahdiyehnorouzi/RAD",
    commitSha: sha,
    requiredCheck: "CI passed",
    exec,
  });
  assert.equal(result.allowed, false);
  assert.match(
    result.reason,
    /completed\/failure, not a passing completed run/,
  );
});

test("verifyCommit refuses when the required check run has not completed yet", () => {
  const sha = "d".repeat(40);
  const exec = (cmd) => {
    if (cmd === "git") return "";
    if (cmd === "gh")
      return JSON.stringify([
        { name: "CI passed", status: "in_progress", conclusion: null },
      ]);
    throw new Error(`unexpected call: ${cmd}`);
  };
  const result = verifyCommit({
    repo: "mahdiyehnorouzi/RAD",
    commitSha: sha,
    requiredCheck: "CI passed",
    exec,
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /in_progress\/pending/);
});

test("verifyCommit allows an ancestor commit with a passing CI passed check", () => {
  const sha = "e".repeat(40);
  const exec = (cmd) => {
    if (cmd === "git") return "";
    if (cmd === "gh")
      return JSON.stringify([
        { name: "CI passed", status: "completed", conclusion: "success" },
      ]);
    throw new Error(`unexpected call: ${cmd}`);
  };
  const result = verifyCommit({
    repo: "mahdiyehnorouzi/RAD",
    commitSha: sha,
    requiredCheck: "CI passed",
    exec,
  });
  assert.equal(result.allowed, true);
});
