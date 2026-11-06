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

/**
 * Builds a fake `exec` that answers the two gh endpoints verifyCommit uses:
 * `commits/<sha>/check-runs` from `checkRunsBySha` and
 * `commits/<sha>/pulls` from `pullsBySha` (both keyed by SHA, defaulting to
 * `[]` for an unlisted SHA). Every call is recorded in `calls` so a test can
 * assert exactly what was requested, and in what order.
 */
function makeExec({ checkRunsBySha = {}, pullsBySha = {} } = {}) {
  const calls = [];
  const exec = (cmd, args) => {
    calls.push([cmd, args]);
    if (cmd === "git") return "";
    if (cmd === "gh") {
      const [, endpoint] = args;
      const match = endpoint.match(
        /^repos\/[^/]+\/[^/]+\/commits\/([^/]+)\/(check-runs|pulls)$/,
      );
      if (!match) throw new Error(`unexpected gh endpoint: ${endpoint}`);
      const [, sha, resource] = match;
      if (resource === "check-runs") {
        return JSON.stringify(checkRunsBySha[sha] ?? []);
      }
      return JSON.stringify(pullsBySha[sha] ?? []);
    }
    throw new Error(`unexpected call: ${cmd}`);
  };
  return { exec, calls };
}

test("verifyCommit refuses when neither the commit nor its merged PR has the required check run", () => {
  const sha = "b".repeat(40);
  const { exec } = makeExec({
    checkRunsBySha: {
      [sha]: [{ name: "Lint", status: "completed", conclusion: "success" }],
    },
  });
  const result = verifyCommit({
    repo: "mahdiyehnorouzi/RAD",
    commitSha: sha,
    requiredCheck: "CI passed",
    exec,
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /no "CI passed" check run found/);
  assert.match(
    result.reason,
    /no single pull request merged into main maps this commit/,
  );
});

test("verifyCommit refuses when the required check run did not succeed", () => {
  const sha = "c".repeat(40);
  const { exec } = makeExec({
    checkRunsBySha: {
      [sha]: [
        { name: "CI passed", status: "completed", conclusion: "failure" },
      ],
    },
  });
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
  const { exec } = makeExec({
    checkRunsBySha: {
      [sha]: [{ name: "CI passed", status: "in_progress", conclusion: null }],
    },
  });
  const result = verifyCommit({
    repo: "mahdiyehnorouzi/RAD",
    commitSha: sha,
    requiredCheck: "CI passed",
    exec,
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /in_progress\/pending/);
});

test("verifyCommit allows an ancestor commit with a passing CI passed check directly on that SHA", () => {
  const sha = "e".repeat(40);
  const { exec } = makeExec({
    checkRunsBySha: {
      [sha]: [
        { name: "CI passed", status: "completed", conclusion: "success" },
      ],
    },
  });
  const result = verifyCommit({
    repo: "mahdiyehnorouzi/RAD",
    commitSha: sha,
    requiredCheck: "CI passed",
    exec,
  });
  assert.equal(result.allowed, true);
});

test("verifyCommit reads check runs for the exact requested commit SHA, not some other ref", () => {
  // This is the call the workflow jobs' new `checks: read` permission
  // exists for (gh's `GET /repos/{owner}/{repo}/commits/{sha}/check-runs`
  // needs that scope against a GITHUB_TOKEN - without it, gh fails with
  // "Resource not accessible by integration" rather than returning check
  // runs). Pinning the exact gh invocation here means a future refactor
  // that accidentally reads some other commit's checks (e.g. HEAD, or the
  // workflow's own github.sha instead of the requested commit_sha) fails
  // this test, not just silently passing the wrong commit's CI result.
  const sha = "f".repeat(40);
  const { exec, calls } = makeExec({
    checkRunsBySha: {
      [sha]: [
        { name: "CI passed", status: "completed", conclusion: "success" },
      ],
    },
  });
  const result = verifyCommit({
    repo: "mahdiyehnorouzi/RAD",
    commitSha: sha,
    requiredCheck: "CI passed",
    exec,
  });

  assert.equal(result.allowed, true);
  const ghCalls = calls.filter(([cmd]) => cmd === "gh");
  assert.equal(ghCalls.length, 1);
  assert.deepEqual(ghCalls[0][1], [
    "api",
    `repos/mahdiyehnorouzi/RAD/commits/${sha}/check-runs`,
    "--jq",
    ".check_runs",
  ]);
});

// Found by actually dry-running `verify-commit` against a real commit on
// `main` while validating PR #162's build-check-only path: `ci.yml` only
// triggers on `pull_request`, so a "Merge pull request #N" commit on `main`
// never gets its own check run - only the PR's head commit does. The three
// tests below pin the fallback that makes real releases possible at all.
test("verifyCommit falls back to the merged PR's head commit when the merge commit itself has no check runs", () => {
  const mergeSha = "0".repeat(40);
  const headSha = "2".repeat(40);
  const { exec, calls } = makeExec({
    checkRunsBySha: {
      [headSha]: [
        { name: "CI passed", status: "completed", conclusion: "success" },
      ],
    },
    pullsBySha: {
      [mergeSha]: [
        {
          number: 161,
          merged_at: "2026-11-06T20:09:12Z",
          base: { ref: "main" },
          head: { sha: headSha },
        },
      ],
    },
  });
  const result = verifyCommit({
    repo: "mahdiyehnorouzi/RAD",
    commitSha: mergeSha,
    requiredCheck: "CI passed",
    exec,
  });
  assert.equal(result.allowed, true);
  assert.match(
    result.reason,
    new RegExp(`verified via its merged PR's head commit ${headSha}`),
  );
  const ghCalls = calls.filter(([cmd]) => cmd === "gh");
  assert.deepEqual(
    ghCalls.map(([, args]) => args[1]),
    [
      `repos/mahdiyehnorouzi/RAD/commits/${mergeSha}/check-runs`,
      `repos/mahdiyehnorouzi/RAD/commits/${mergeSha}/pulls`,
      `repos/mahdiyehnorouzi/RAD/commits/${headSha}/check-runs`,
    ],
  );
});

test("verifyCommit refuses the merge-commit fallback when zero merged PRs map to it", () => {
  const mergeSha = "3".repeat(40);
  const { exec } = makeExec({ pullsBySha: { [mergeSha]: [] } });
  const result = verifyCommit({
    repo: "mahdiyehnorouzi/RAD",
    commitSha: mergeSha,
    requiredCheck: "CI passed",
    exec,
  });
  assert.equal(result.allowed, false);
  assert.match(
    result.reason,
    /no single pull request merged into main maps this commit/,
  );
});

test("verifyCommit refuses the merge-commit fallback when more than one merged PR maps to it (ambiguous)", () => {
  const mergeSha = "4".repeat(40);
  const { exec } = makeExec({
    pullsBySha: {
      [mergeSha]: [
        {
          number: 10,
          merged_at: "2026-01-01T00:00:00Z",
          base: { ref: "main" },
          head: { sha: "a".repeat(40) },
        },
        {
          number: 11,
          merged_at: "2026-01-02T00:00:00Z",
          base: { ref: "main" },
          head: { sha: "b".repeat(40) },
        },
      ],
    },
  });
  const result = verifyCommit({
    repo: "mahdiyehnorouzi/RAD",
    commitSha: mergeSha,
    requiredCheck: "CI passed",
    exec,
  });
  assert.equal(result.allowed, false);
  assert.match(
    result.reason,
    /no single pull request merged into main maps this commit/,
  );
});

test("verifyCommit refuses the merge-commit fallback when the PR's head commit also lacks a passing check", () => {
  const mergeSha = "5".repeat(40);
  const headSha = "6".repeat(40);
  const { exec } = makeExec({
    checkRunsBySha: {
      [headSha]: [
        { name: "CI passed", status: "completed", conclusion: "failure" },
      ],
    },
    pullsBySha: {
      [mergeSha]: [
        {
          number: 12,
          merged_at: "2026-01-03T00:00:00Z",
          base: { ref: "main" },
          head: { sha: headSha },
        },
      ],
    },
  });
  const result = verifyCommit({
    repo: "mahdiyehnorouzi/RAD",
    commitSha: mergeSha,
    requiredCheck: "CI passed",
    exec,
  });
  assert.equal(result.allowed, false);
  assert.match(result.reason, new RegExp(`merged PR head ${headSha}`));
  assert.match(
    result.reason,
    /completed\/failure, not a passing completed run/,
  );
});

test("verifyCommit never calls gh api when the ancestry check fails first", () => {
  // Fail-closed ordering: a commit that isn't even on main must never reach
  // the check-runs lookup (and therefore never needs checks: read to
  // succeed in order to be correctly refused).
  const sha = "1".repeat(40);
  let ghCalled = false;
  const exec = (cmd) => {
    if (cmd === "git") throw new Error("not an ancestor");
    if (cmd === "gh") {
      ghCalled = true;
      return "[]";
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
  assert.equal(ghCalled, false);
});
