import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  parseDeployJobs,
  simulateDeployWorkflow,
} from "./deploy-workflow-conditions.mjs";

const deployYmlPath = fileURLToPath(
  new URL("../../.github/workflows/deploy.yml", import.meta.url),
);
const jobs = parseDeployJobs(readFileSync(deployYmlPath, "utf8"));

const ALL_AFFECTED = { api: true, storefront: true, admin: true };
const NONE_AFFECTED = { api: false, storefront: false, admin: false };

test("push to main with passing checks deploys api then frontend", () => {
  const results = simulateDeployWorkflow(jobs, {
    eventName: "push",
    affected: ALL_AFFECTED,
  });
  assert.equal(results.checks, "success");
  assert.equal(results.detect, "success");
  assert.equal(results["deploy-api"], "success");
  assert.equal(results["deploy-frontend"], "success");
});

test("push to main with failing CI checks never deploys", () => {
  const results = simulateDeployWorkflow(jobs, {
    eventName: "push",
    affected: ALL_AFFECTED,
    outcomes: { checks: "failure" },
  });
  assert.equal(results.detect, "skipped");
  assert.equal(results["deploy-api"], "skipped");
  assert.equal(results["deploy-frontend"], "skipped");
});

test("regression: workflow_dispatch with checks intentionally skipped still deploys api then frontend", () => {
  // This is exactly GitHub Actions run #45118795717: workflow_dispatch,
  // confirm=deploy, commit verified, detect reported api/storefront/admin
  // all true, checks correctly skipped (push-only gate) - and yet
  // deploy-api and deploy-frontend both skipped while the workflow still
  // reported overall success. This must now run both deploy jobs.
  const results = simulateDeployWorkflow(jobs, {
    eventName: "workflow_dispatch",
    affected: ALL_AFFECTED,
  });
  assert.equal(results.checks, "skipped");
  assert.equal(results.detect, "success");
  assert.equal(results["deploy-api"], "success");
  assert.equal(results["deploy-frontend"], "success");
});

test("workflow_dispatch with no affected services deploys nothing (not a bug)", () => {
  const results = simulateDeployWorkflow(jobs, {
    eventName: "workflow_dispatch",
    affected: NONE_AFFECTED,
  });
  assert.equal(results.detect, "success");
  assert.equal(results["deploy-api"], "skipped");
  assert.equal(results["deploy-frontend"], "skipped");
});

test("workflow_dispatch deploys api only when just api is affected, frontend stays skipped", () => {
  const results = simulateDeployWorkflow(jobs, {
    eventName: "workflow_dispatch",
    affected: { api: true, storefront: false, admin: false },
  });
  assert.equal(results["deploy-api"], "success");
  assert.equal(results["deploy-frontend"], "skipped");
});

test("deploy-frontend waits for deploy-api to succeed before running, on both triggers", () => {
  for (const eventName of ["push", "workflow_dispatch"]) {
    const results = simulateDeployWorkflow(jobs, {
      eventName,
      affected: ALL_AFFECTED,
      outcomes: { "deploy-api": "failure" },
    });
    assert.equal(results["deploy-api"], "failure");
    assert.equal(
      results["deploy-frontend"],
      "skipped",
      `deploy-frontend should not run after a failed deploy-api on ${eventName}`,
    );
  }
});

test("every job's if is parsed as non-empty (catches a parser/workflow-syntax drift)", () => {
  for (const id of Object.keys(jobs)) {
    assert.ok(
      jobs[id].if && jobs[id].if.length > 0,
      `job "${id}" has no parsed if condition`,
    );
  }
});
