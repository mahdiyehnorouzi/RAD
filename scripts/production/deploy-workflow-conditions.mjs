#!/usr/bin/env node
// Regression coverage for deploy.yml's job `if`/`needs` graph (the bug
// found in GitHub Actions run #45118795717: a manually dispatched release
// reported overall success while silently deploying nothing).
//
// Root cause: `deploy-api`'s `if: needs.detect.outputs.api == 'true'` had no
// explicit status-check function (always()/success()/failure()/
// cancelled()), so GitHub implicitly ANDed it with a bare `success()`. Bare
// `success()` evaluates over the job's *entire transitive* ancestor chain
// (here: detect, preflight, and checks - not just `detect`, which is all
// `deploy-api` itself lists under `needs`). On workflow_dispatch, `checks`
// is intentionally skipped (it's a push-only CI gate), so that implicit
// success() was false even though `detect` had already succeeded with
// `api: 'true'` - and `deploy-api` silently skipped on every manual
// dispatch. `deploy-frontend` then skipped too, cascading from
// `deploy-api`'s result rather than from its own condition.
//
// This module re-implements just enough of GitHub Actions' job-condition
// semantics (the implicit success() wrap, and that bare success() looks at
// the full transitive `needs` graph, not only the job's own `needs:` list)
// to simulate deploy.yml's actual job graph for a given scenario, so the
// push-triggered path and the workflow_dispatch path (including "checks
// intentionally skipped") can be asserted against without running a real
// GitHub Actions workflow.

/** Order matters: each job's `needs` must already be defined. */
const JOB_IDS = [
  "preflight",
  "checks",
  "detect",
  "deploy-api",
  "deploy-frontend",
  "summary",
];
const STATUS_FNS = ["always(", "success(", "failure(", "cancelled("];

/**
 * Parses the `needs:` and `if:` of each job in JOB_IDS out of deploy.yml's
 * raw text. Deliberately not a general YAML parser - deploy.yml's job
 * blocks are simple enough (2-space job indent, no nested nodes sharing a
 * job id's name) that locating each job's block by its header line and
 * slicing until the next one is reliable, and keeps this free of an
 * undeclared transitive YAML-parser dependency.
 */
export function parseDeployJobs(yamlText) {
  const lines = yamlText.split("\n");
  const headerIndex = new Map();
  for (let i = 0; i < lines.length; i++) {
    const match = /^  ([A-Za-z0-9_-]+):\s*$/.exec(lines[i]);
    if (match && JOB_IDS.includes(match[1])) headerIndex.set(match[1], i);
  }

  const jobs = {};
  for (const id of JOB_IDS) {
    const start = headerIndex.get(id);
    if (start === undefined)
      throw new Error(`deploy.yml: job "${id}" not found`);
    let end = lines.length;
    for (const otherStart of headerIndex.values()) {
      if (otherStart > start && otherStart < end) end = otherStart;
    }
    const block = lines.slice(start + 1, end);
    jobs[id] = { needs: parseNeeds(block), if: parseIf(block) };
  }
  return jobs;
}

function parseNeeds(block) {
  for (let i = 0; i < block.length; i++) {
    const line = block[i];
    const inline = /^\s{4}needs:\s*(.+)$/.exec(line);
    if (!inline) continue;
    const value = inline[1].trim();
    if (value.startsWith("[")) {
      return value
        .replace(/^\[|\]$/g, "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    if (value === "") {
      // Multi-line list form: `needs:\n      - a\n      - b`
      const items = [];
      for (let j = i + 1; j < block.length; j++) {
        const item = /^\s{6}-\s*(\S+)/.exec(block[j]);
        if (!item) break;
        items.push(item[1]);
      }
      return items;
    }
    return [value];
  }
  return [];
}

function parseIf(block) {
  for (let i = 0; i < block.length; i++) {
    const inline = /^\s{4}if:\s*(.+)$/.exec(block[i]);
    if (inline) {
      if (inline[1].trim() === "|") return parseBlockScalar(block, i);
      return inline[1].trim();
    }
    const blockStart = /^\s{4}if:\s*\|\s*$/.exec(block[i]);
    if (blockStart) return parseBlockScalar(block, i);
  }
  return undefined;
}

function parseBlockScalar(block, headerLine) {
  const parts = [];
  for (let j = headerLine + 1; j < block.length; j++) {
    const content = /^\s{6}(.*)$/.exec(block[j]);
    if (!content) break;
    parts.push(content[1].trim());
  }
  return parts.join(" ").trim();
}

function hasExplicitStatusFn(expr) {
  return STATUS_FNS.some((fn) => expr.includes(fn));
}

/** Tiny recursive-descent evaluator for the subset of GHA expression syntax deploy.yml uses. */
function evaluateExpr(expr, resolve) {
  let pos = 0;

  function skipWs() {
    while (pos < expr.length && /\s/.test(expr[pos])) pos++;
  }
  function peek(token) {
    skipWs();
    return expr.startsWith(token, pos);
  }
  function consume(token) {
    skipWs();
    if (!expr.startsWith(token, pos))
      throw new Error(`expected "${token}" at ${pos} in: ${expr}`);
    pos += token.length;
  }

  function parseOr() {
    let left = parseAnd();
    while (peek("||")) {
      consume("||");
      const right = parseAnd(); // must always parse to advance `pos`, even once `left` is already true
      left = left || right;
    }
    return left;
  }
  function parseAnd() {
    let left = parseUnary();
    while (peek("&&")) {
      consume("&&");
      const right = parseUnary(); // must always parse to advance `pos`, even once `left` is already false
      left = left && right;
    }
    return left;
  }
  function parseUnary() {
    if (peek("!")) {
      consume("!");
      return !parseUnary();
    }
    return parseComparison();
  }
  function parseComparison() {
    const left = parsePrimary();
    skipWs();
    if (expr.startsWith("==", pos)) {
      consume("==");
      return left === parsePrimary();
    }
    if (expr.startsWith("!=", pos)) {
      consume("!=");
      return left !== parsePrimary();
    }
    return left;
  }
  function parsePrimary() {
    skipWs();
    if (peek("(")) {
      consume("(");
      const value = parseOr();
      consume(")");
      return value;
    }
    if (expr[pos] === "'") {
      const end = expr.indexOf("'", pos + 1);
      const value = expr.slice(pos + 1, end);
      pos = end + 1;
      return value;
    }
    const match = /^[A-Za-z_][\w.\-]*(\(\))?/.exec(expr.slice(pos));
    if (!match) throw new Error(`unexpected token at ${pos} in: ${expr}`);
    pos += match[0].length;
    return resolve(match[0]);
  }

  const result = parseOr();
  skipWs();
  if (pos !== expr.length)
    throw new Error(`trailing input at ${pos} in: ${expr}`);
  return result;
}

/**
 * Simulates deploy.yml's job graph for one scenario and returns each job's
 * conclusion ("success" | "failure" | "skipped").
 *
 * scenario:
 *   eventName: "push" | "workflow_dispatch"
 *   affected: { api, storefront, admin } booleans (detect's real output,
 *     for push-triggered events this normally comes from the actual diff)
 *   outcomes: optional per-job override, e.g. { "deploy-api": "failure" } -
 *     a job that runs succeeds unless overridden here.
 */
export function simulateDeployWorkflow(jobs, scenario) {
  const { eventName, affected, outcomes = {} } = scenario;
  const results = {};
  const outputs = {};

  function transitiveAncestors(jobId, seen = new Set()) {
    for (const needed of jobs[jobId].needs) {
      if (seen.has(needed)) continue;
      seen.add(needed);
      transitiveAncestors(needed, seen);
    }
    return seen;
  }

  function resolve(jobId, token) {
    if (token === "always()") return true;
    if (token === "success()") {
      const ancestors = transitiveAncestors(jobId);
      return [...ancestors].every((id) => results[id] === "success");
    }
    if (token === "failure()") {
      const ancestors = transitiveAncestors(jobId);
      return [...ancestors].some((id) => results[id] === "failure");
    }
    if (token === "cancelled()") return false;
    if (token === "github.event_name") return eventName;
    if (token === "github.repository") return "mahdiyehnorouzi/RAD";
    const needsMatch = /^needs\.([\w-]+)\.(result|outputs\.([\w-]+))$/.exec(
      token,
    );
    if (needsMatch) {
      const [, refJobId, kind, outputName] = needsMatch;
      if (kind === "result") return results[refJobId] ?? "skipped";
      return outputs[refJobId]?.[outputName] ?? "";
    }
    throw new Error(`unresolvable token "${token}"`);
  }

  for (const jobId of JOB_IDS) {
    const job = jobs[jobId];
    const directNeedsComplete = job.needs.every((n) => n in results);
    if (!directNeedsComplete)
      throw new Error(
        `"${jobId}" needs a job not yet simulated - check JOB_IDS order`,
      );

    const expr = job.if;
    const explicit = hasExplicitStatusFn(expr);
    const literalCondition = evaluateExpr(expr, (token) =>
      resolve(jobId, token),
    );
    const transitiveOk = explicit
      ? true
      : [...transitiveAncestors(jobId)].every(
          (id) => results[id] === "success",
        );
    const shouldRun = transitiveOk && literalCondition;

    if (!shouldRun) {
      results[jobId] = "skipped";
      continue;
    }
    results[jobId] = outcomes[jobId] ?? "success";
    if (jobId === "detect" && results[jobId] === "success") {
      outputs.detect = {
        api: String(affected.api),
        storefront: String(affected.storefront),
        admin: String(affected.admin),
        any: String(affected.api || affected.storefront || affected.admin),
      };
    }
  }

  return results;
}
