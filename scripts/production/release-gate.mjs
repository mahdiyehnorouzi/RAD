#!/usr/bin/env node
// RAD-129: decision logic for the manual production-release workflows
// (deploy.yml, deploy-api-vps.yml, deploy-frontend-vps.yml).
//
// `affectedServices` is the dependency map deploy.yml's `detect` job used to
// apply as inline bash (see docs/cicd-pipeline.md's "Dependency map"); it is
// pulled out here so it has a real, committed test
// (release-gate.spec.mjs), not just a one-off manual check. The CLI's
// `affected-services` subcommand is the thin wrapper the workflow calls.
//
// `verifyCommit` is the fail-closed gate RAD-129 requires before any release
// workflow builds or ships anything: the requested commit must (a) actually
// be reachable from `main` and (b) have a passing "CI passed" check run
// recorded against that exact SHA (not re-run - re-running against a
// possibly-stale checkout of `main`'s tip would silently check the wrong
// commit's code when `commit_sha` is an older, already-merged commit). Both
// checks shell out (`git`, `gh`) and are exercised for real in CI via
// `node scripts/production/release-gate.mjs verify-commit` against this
// commit's own repo state - see the "Shell syntax" / release-policy job in
// ci.yml for where that happens, and docs/cicd-pipeline.md for the manual
// dry-run evidence recorded for this change.
//
// Merge-commit caveat, found by actually dry-running this against a real
// commit on `main` (see PR #162's follow-up fix): `ci.yml` only triggers on
// `pull_request`, so the check run named "CI passed" is recorded against
// the PR's *head* commit, never against the "Merge pull request #N" commit
// GitHub creates on `main` - confirmed live: `main`'s actual tip after
// merging PR #161 (027d854d...) has zero check runs of its own, while that
// PR's head commit (3b3f0e8b...) has the real, passing "CI passed" run.
// Every commit that ever reaches `main` here is one of these synthetic
// merge commits, so requiring the check run directly on `commit_sha` would
// refuse every single real release candidate. `verifyCommit` therefore
// falls back to `GET /repos/{repo}/commits/{sha}/pulls` when `commit_sha`
// has NO check run by the required name at all: if that lookup finds
// exactly one PR merged into `main`, it checks that PR's head commit
// instead - the commit CI actually ran against - and reports which SHA it
// verified. A check run that *does* exist directly on `commit_sha` but
// failed, was cancelled, or is still pending never falls back - that
// refuses immediately, on its own result, regardless of what any other
// commit's check run says.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

export function affectedServices(changedFiles) {
  const matches = (re) => changedFiles.some((f) => re.test(f));

  let api = false;
  let storefront = false;
  let admin = false;

  if (matches(/^apps\/api\//)) api = true;
  if (matches(/^apps\/storefront\//)) storefront = true;
  if (matches(/^apps\/admin\//)) admin = true;
  if (matches(/^packages\/artworks\//)) {
    api = true;
    storefront = true;
  }
  if (matches(/^packages\/types\//)) {
    storefront = true;
    admin = true;
  }
  if (matches(/^packages\/ui\//)) {
    storefront = true;
    admin = true;
  }
  if (matches(/^packages\/i18n\//)) storefront = true;
  if (matches(/^packages\/state\//)) {
    storefront = true;
    admin = true;
  }

  // Shared root-level config/infra any app's build could depend on -
  // conservative on purpose (mirrors the previous inline-bash behavior).
  const sharedInfra =
    /^(package\.json|package-lock\.json|tsconfig.*\.json|apps\/api\/Dockerfile(\..*)?|apps\/storefront\/Dockerfile|apps\/admin\/Dockerfile|docker-compose\.frontend-vps\.yml|scripts\/production\/.*|scripts\/deploy-api-systemd-artifact\.sh|scripts\/lib\/deploy-api-remote-artifact\.sh|scripts\/deploy-api-systemd\.sh|scripts\/lib\/deploy-api-remote\.sh|\.github\/workflows\/deploy\.yml|\.github\/workflows\/deploy-api-vps\.yml|\.github\/workflows\/deploy-frontend-vps\.yml)$/;
  if (matches(sharedInfra)) {
    api = true;
    storefront = true;
    admin = true;
  }

  const any = api || storefront || admin;
  return { api, storefront, admin, any };
}

/** Reads the check runs GitHub recorded against one exact commit SHA. */
function readCheckRuns({ repo, sha, exec }) {
  const raw = exec(
    "gh",
    ["api", `repos/${repo}/commits/${sha}/check-runs`, "--jq", ".check_runs"],
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" },
  );
  return JSON.parse(raw);
}

/**
 * Finds the exactly-one pull request merged into `main` whose merge commit
 * is `sha` - used only as a fallback when `sha` itself (a synthetic "Merge
 * pull request" commit) has no check runs of its own; see the module
 * header comment.
 * @returns {string|undefined} that PR's head commit SHA, or undefined if
 *   zero or more than one candidate PR was found (ambiguous - refuse
 *   rather than guess).
 */
function findMergedPrHeadSha({ repo, sha, exec }) {
  let pulls;
  try {
    const raw = exec("gh", ["api", `repos/${repo}/commits/${sha}/pulls`], {
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    });
    pulls = JSON.parse(raw);
  } catch {
    return undefined;
  }
  const merged = pulls.filter(
    (pr) => pr.merged_at && pr.base?.ref === "main" && pr.head?.sha,
  );
  return merged.length === 1 ? merged[0].head.sha : undefined;
}

/**
 * `found` distinguishes "no check run by this name at all" (the expected,
 * safe-to-fall-back-to-the-PR-head case for a synthetic merge commit) from
 * "a check run by this name exists but didn't pass" (failed, cancelled,
 * still pending, etc.) - the latter must refuse outright, never fall back
 * to a *different* commit's check run just because it happens to pass.
 */
function evaluateCheckRuns(checkRuns, requiredCheck) {
  const match = checkRuns.find((run) => run.name === requiredCheck);
  if (!match) {
    return {
      ok: false,
      found: false,
      reason: `no "${requiredCheck}" check run found`,
    };
  }
  if (match.status !== "completed" || match.conclusion !== "success") {
    return {
      ok: false,
      found: true,
      reason: `"${requiredCheck}" is ${match.status}/${match.conclusion ?? "pending"}, not a passing completed run`,
    };
  }
  return {
    ok: true,
    found: true,
    reason: `a passing "${requiredCheck}" check`,
  };
}

/**
 * @param {{repo: string, commitSha: string, requiredCheck: string, exec?: typeof execFileSync}} opts
 * @returns {{allowed: boolean, reason: string}}
 */
export function verifyCommit({
  repo,
  commitSha,
  requiredCheck,
  exec = execFileSync,
}) {
  if (!/^[0-9a-f]{40}$/i.test(commitSha)) {
    return {
      allowed: false,
      reason: `commit_sha "${commitSha}" is not a full 40-character SHA`,
    };
  }

  try {
    exec("git", ["merge-base", "--is-ancestor", commitSha, "origin/main"], {
      stdio: "pipe",
    });
  } catch {
    return {
      allowed: false,
      reason: `${commitSha} is not an ancestor of origin/main - refusing to release a commit that is not on main`,
    };
  }

  let checkRuns;
  try {
    checkRuns = readCheckRuns({ repo, sha: commitSha, exec });
  } catch (error) {
    return {
      allowed: false,
      reason: `could not read check runs for ${commitSha}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const direct = evaluateCheckRuns(checkRuns, requiredCheck);
  if (direct.ok) {
    return {
      allowed: true,
      reason: `${commitSha} is on main with ${direct.reason}`,
    };
  }

  // A check run by this exact name exists on commitSha but did not pass
  // (failed, cancelled, still pending, ...) - refuse immediately. Never
  // fall back to the PR head commit here: that would let a *different*
  // commit's passing check override this commit's own known-bad result,
  // which is not "CI passed for this exact SHA" by any reasonable reading.
  // The fallback below is only for "no check run by this name at all",
  // the expected case for a synthetic "Merge pull request" commit.
  if (direct.found) {
    return {
      allowed: false,
      reason: `${commitSha}: ${direct.reason}`,
    };
  }

  const headSha = findMergedPrHeadSha({ repo, sha: commitSha, exec });
  if (!headSha) {
    return {
      allowed: false,
      reason: `${commitSha}: ${direct.reason}, and no single pull request merged into main maps this commit to a head commit to check instead`,
    };
  }

  let headCheckRuns;
  try {
    headCheckRuns = readCheckRuns({ repo, sha: headSha, exec });
  } catch (error) {
    return {
      allowed: false,
      reason: `could not read check runs for ${commitSha}'s merged PR head ${headSha}: ${error instanceof Error ? error.message : String(error)}`,
    };
  }

  const viaHead = evaluateCheckRuns(headCheckRuns, requiredCheck);
  if (!viaHead.ok) {
    return {
      allowed: false,
      reason: `${commitSha}'s merged PR head ${headSha}: ${viaHead.reason}`,
    };
  }

  return {
    allowed: true,
    reason: `${commitSha} is on main; verified via its merged PR's head commit ${headSha}, which has ${viaHead.reason}`,
  };
}

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace(/^--/, "");
    flags[key] = args[i + 1];
  }
  return flags;
}

function main() {
  const [command, ...rest] = process.argv.slice(2);

  if (command === "affected-services") {
    const flags = parseFlags(rest);
    const changedFiles = readFileSync(flags["changed-files"], "utf8")
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const result = affectedServices(changedFiles);
    console.log(`api=${result.api}`);
    console.log(`storefront=${result.storefront}`);
    console.log(`admin=${result.admin}`);
    console.log(`any=${result.any}`);
    return;
  }

  if (command === "verify-commit") {
    const flags = parseFlags(rest);
    const result = verifyCommit({
      repo: flags.repo,
      commitSha: flags["commit-sha"],
      requiredCheck: flags["required-check"],
    });
    console.error(result.reason);
    if (!result.allowed) process.exit(1);
    return;
  }

  console.error(
    `Unknown command: ${command}. Expected "affected-services" or "verify-commit".`,
  );
  process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
