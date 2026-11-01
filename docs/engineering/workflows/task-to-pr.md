# RAD agent task-to-PR workflow

**Status:** operating procedure for agents. This file does not add a workflow, a ruleset, a required check, or an orchestrator. A sentence here is enforced only when GitHub or CI already enforces it.

References: root [`AGENTS.md`](../../../AGENTS.md), [`ARCHITECTURE.md`](../../../ARCHITECTURE.md), [ADR-007](../adr/adr-007-test-first-refactoring.md), [ADR-008](../adr/adr-008-agent-engineering-system.md), the `rad-safe-refactor` skill, and [`docs/cicd-pipeline.md`](../../cicd-pipeline.md). App-specific rules live in each app's `AGENTS.md` when that file has a hand-maintained section. Behavior-preserving refactors follow `rad-safe-refactor`; this page does not restate that skill.

The default integration base is the latest `origin/main`. Do not treat a historical foundation branch, or any fixed PR number, as a permanent base.

## What is enforced, what is human, what is practice

**Enforced on `main` today** (repository ruleset `main`, active):

- Changes land through a pull request. Force-push and branch deletion are blocked.
- Allowed merge methods are merge, squash, and rebase.
- The required status check is `CI passed`, and the head must be up to date with `main` (`strict_required_status_checks_policy`). A green check on an older commit does not cover a later head.
- The ruleset does not require a minimum number of approving reviews, code-owner review, or resolved review threads.

**Required by project policy, and not automated:**

- Root `AGENTS.md` §§8–9 and §13, and `rad-safe-refactor`'s human-approval section. An agent does not approve its own security-sensitive change, does not mark that PR ready, and does not merge or deploy it.
- ADR-007: a critical-flow structural change needs a characterization test of current behavior before the structural commit. The reviewer must be able to see that the test passed against the pre-change code.
- Ambiguous payment, inventory, auth, or database behavior stops for a human decision. Do not invent the rule.

**Recommended:**

- Open the PR as a draft until a human has read it.
- One task per branch. Prefer a small diff a reviewer can read in one pass.
- Record **inspected**, **tested**, **manually verified**, and **not verified** separately (`AGENTS.md` §10).

## 1. Intake and acceptance criteria

Record intended behavior, affected apps, explicit exclusions, and whether the task is a feature, a bug fix, or a behavior-preserving refactor. Write acceptance criteria a reviewer can check. If the business rule is uncertain, ask before editing.

## 2. Risk and human approval

Classify from the current code and tests, then say which gate applies:

- **Critical:** payment, order state, inventory reservation, authentication, authorization, database writes, media authorization. Structural work needs characterization tests first (ADR-007) and human approval before merge (`AGENTS.md` §9).
- **High:** cart, checkout, and admin order handling. Same characterization expectation when the change is structural.
- **Medium or low:** UI composition and docs. Tests may land in the same PR when the description says so (ADR-007). Security-sensitive areas stay critical even if the edit looks mechanical.

ADR-007's coverage table is the October 2026 audit. Re-read the specs on the current commit before classifying a module as untested.

Use `rad-safe-refactor`'s readiness classes for a structural task: READY, NEEDS TESTS, NEEDS DECISION, or BLOCKED. Stop on NEEDS DECISION and BLOCKED.

## 3. Inspection and source of truth

Follow `AGENTS.md` §4 before editing: current implementation, routes, API calls, controller/DTO/service, entities, and existing tests. The API is the source of truth for availability, pricing, payment, and authorization. Audit line counts and architecture notes lose to the current source. Read the touched app's `AGENTS.md` and any ADR whose title matches the area.

## 4. Branch and worktree isolation

Start from the latest `origin/main` unless the task genuinely depends on an unmerged PR. Use one branch or worktree for the task. Do not discard or rewrite unrelated working-tree changes. Do not force-push.

A stacked PR is allowed only when this work cannot be reviewed without the other PR's commits. Branch from that PR's head and set the base to that PR's branch. After the dependency merges, retarget to `main`, merge `origin/main` in, and read the new diff. A conflict that needs an architectural decision stops the update.

## 5. Baseline and characterization tests

Run the smallest relevant command from `AGENTS.md` §3 and record the result before changing behavior. If the area has no adequate test, say so. For a critical or high structural change, add characterization tests of observed behavior, run them on the pre-change code, and only then edit the implementation. Do not loosen those assertions so the new code passes.

## 6. Minimal implementation scope

One coherent change. Leave unrelated refactors, renames, dependency upgrades, and schema changes out. Do not move a transaction boundary, lock, validation rule, error code, or backend contract as a side effect. If the task seems to require that, stop.

## 7. Validation and CI

Locally, run the narrowest relevant script from `AGENTS.md` §3, then the broader check the change can affect. Usual order for code: the spec, `npm test` when the change crosses the area's suite, `npm run typecheck:all`, `npm run lint`. Do not invent commands.

On a pull request, `.github/workflows/ci.yml` runs, and the ruleset looks only at the aggregate job **CI passed**. That job fails unless all of these succeed:

- Lint: no tracked env files, `npm run lint`, `npm run knip`, and `npm run format:changed:check` (Prettier on files the PR changes; `*.md` is ignored)
- Typecheck: `npm run typecheck:all`
- Test: `npm test`
- Test (API media/ownership, DB-backed): `npm run test:media --workspace @rad/api`
- Build: API `build`; admin and storefront `build:vinext`; admin and storefront standalone `build`
- Release broker and workflow policy
- Release signature verification

A docs-only PR still runs this workflow. Passing it does not prove a UI flow or a production deploy.

## 8. Independent review

For a §9 area, the implementing agent is not the reviewer. The review re-checks scope, tests, behavior preservation, auth, transaction and lock boundaries, and cross-app contracts. GitHub will not block the merge for a missing approving review. The PR description must say that human sign-off is still required.

## 9. Draft PR and merge readiness

Open a draft PR against `main`, or against the dependency branch from §4. Include objective, files, risk class, commands and results, UX checks, rollback, and open questions. Leave it draft. Do not merge.

Ready means: the diff matches the task, `CI passed` is green on that head, the branch is up to date with its base, required human sign-off is explicit, and skipped checks are listed. A green format check or a pushed branch is not completion.

## 10. Merge, deploy, and post-deploy verification

A human merges. The ruleset accepts merge, squash, or rebase. Do not bypass a missing or stale `CI passed` check.

A push to `main` starts `.github/workflows/deploy.yml`. That workflow runs CI again, then deploys only the services its path filter marks. Docs-only pushes do not deploy. Changes under `apps/`, shared `packages/`, or the deploy scripts can. Agents do not run `workflow_dispatch`, do not SSH to the VPS, and do not declare production healthy. Post-deploy checks belong to a human, using [`docs/cicd-pipeline.md`](../../cicd-pipeline.md).

## 11. Rollback

State how to revert the PR. For a change that can deploy, name the service the path filter would release and point at the rollback steps in [`docs/cicd-pipeline.md`](../../cicd-pipeline.md). Do not run a production rollback from an agent task. Do not change deploy configuration in order to make a revert easier.

## 12. Completion report

Include: PR URL and base; files changed; intended and observed behavior; baseline and new tests with commands and results; what CI enforced; independent-review and human-approval status; deploy impact (none, or which services a `main` push would consider); rollback; remaining risks and checks not run.
