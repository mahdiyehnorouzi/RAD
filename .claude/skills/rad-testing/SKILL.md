---
name: rad-testing
description: >-
  Select, characterize, execute, and report tests for a RAD change from
  the current tree. Use for test planning, regression protection, baseline
  verification, characterization tests, or diagnosing failures. Structural
  refactors stay with rad-safe-refactor. Follow ADR-007, the task-to-PR
  workflow, and repository scripts. Do not invent tools or claim a test
  ran when it did not.
---

# RAD testing

## Applies to

Use when designing or implementing tests, judging coverage for a change,
running a baseline, or diagnosing a failed test. From this worktree, read
root `AGENTS.md`, the touched app's `AGENTS.md`,
`docs/engineering/adr/adr-007-test-first-refactoring.md`,
`docs/engineering/workflows/task-to-pr.md`, the relevant `package.json`
scripts, and the existing specs. Do not guess coverage from memory or from
ADR-007's October 2026 table.

When the task is a behavior-preserving structural refactor,
`rad-safe-refactor` owns the readiness class (READY / NEEDS TESTS /
NEEDS DECISION / BLOCKED), the characterization commit before the
structural commit, and the freeze on transaction, lock, validation, and
error-code boundaries. This skill owns which behavior to pin, which real
command to run, and the evidence report. A feature or bug fix uses this
skill directly. Its tests assert the new or corrected behavior and are
labeled as that, separate from characterization tests.

## Session and safety preflight

1. Record the working directory, branch, HEAD, and `git status --short`.
   Confirm this worktree contains the requested change. A skill file in
   another worktree is not loaded here.
2. Inspect the implementation, its callers, nearby specs, and package
   scripts before choosing a command.
3. Classify from the current code:
   - **Critical** — payment, authentication, authorization, order
     ownership, inventory and 1/1 availability, pricing, media or file
     authorization, and database writes (`AGENTS.md` §9, ADR-007).
   - **High** — cart, checkout, and admin order handling (task-to-PR).
     ADR-007 names `cart.service.ts`, `orders.service.ts`,
     `admin-dashboard.tsx`, and the media/storage security controls as
     modules whose structural edits need characterization first.
   - **Medium or low** — UI composition and docs. A critical area stays
     critical when the edit looks mechanical.
4. Re-read specs on this commit before calling a module untested. The
   October 2026 table is a snapshot. On the `main` merged for this skill,
   `apps/api/src/cart/cart-reliability.spec.ts` exists and runs inside
   `test:inventory`; admin `lib/*.spec.ts` exists; storefront and
   `@rad/types` have `node:test` suites. `admin-dashboard.tsx` still has
   no spec of its own (a path mention in `password-change.spec.ts` is not
   coverage). Nearby specs count only when they pin the behavior this
   change can break.
5. DB-backed suites start a throwaway embedded Postgres and hardcode a
   localhost connection (the purchase harness and the media/ownership
   specs). They do not read `DATABASE_URL`. Never aim a test, seed,
   migration, or script at production or any non-local database. Do not
   set `RAD_ALLOW_REMOTE_DB_WRITE`. Do not call production HTTP, payment
   gateways, customer records, or real object storage.
   `assertSafeScriptTarget` refuses non-local writes for mutating scripts;
   it is not permission to run tests against a remote database.

## Plan tests from behavior and risk

State the changed behavior or the preserved invariant, the observable
inputs and outputs, error paths, authorization, transaction and lock
scope, and concurrency where the code has them. Write a focused matrix
and list the coverage gaps you are leaving.

For a structural change in a critical or high flow, or in a module
ADR-007 names, add characterization tests against the unchanged code
first, including where other tests exist but do not pin the affected
behavior. Run those tests on the pre-change code and keep that result.
Inadequate coverage is **NEEDS TESTS**, not READY. Lower-risk UI
composition may add tests in the same change when the PR says so. Do not
use that exception for a sensitive flow.

A characterization test asserts observed current behavior, including
awkward edges. A test of new or corrected behavior belongs to the feature
or bug fix. Do not loosen a characterization assertion so later code can
pass. Do not make a test pass by moving a `dataSource.transaction`
boundary, weakening `pessimistic_write` or an inventory hold, skipping an
auth guard, dropping a structured error `code`, or relaxing a
service-level rule. Tracking-number normalization in `payment-receipt.ts`
is the business rule; the DTO `MaxLength` is only a sanity bound. If the
test passes only by changing one of those, stop for a human decision.

## Choose the smallest real command

Read the `package.json` that owns the code. Prefer the narrow script that
already covers that directory, then that workspace's `test` script, then
root `npm test`, then typecheck and lint when the change can affect them.
Confirm the script still exists before running it.

Commands present on the `main` merged for this skill:

- `npm run test:<area> --workspace @rad/api`, where `<area>` is a script
  in `apps/api/package.json`. Its `test` script chains `test:pricing`,
  `test:purchase`, `test:catalog`, `test:compression`, `test:inventory`
  (inventory, cart, and guest id), `test:database`, `test:health`,
  `test:deploy`, `test:collaboration`, `test:commissions`, `test:media`,
  `test:mail`, `test:seed`, `test:auth`, `test:attributes`,
  `test:payment`, and `test:addresses`.
- `npm run test --workspace @rad/storefront`
- `npm run test --workspace @rad/admin`
- `npm run test --workspace @rad/types`
- `npm test` at the repo root (`npm run test --workspaces --if-present`)
- `npm run typecheck:all`
- `npm run lint`

A single file uses the same `tsx` invocation as that package script,
including any flags it already passes, with the file in place of the
glob. Run it from that package. Do not add a runner.

`apps/Rad-App` is not an npm workspace. It has its own lockfile, and its
test script is Jest. From the repo root, run `npm run app:test`. Do not
bypass `npm run app:check:isolation`, and do not add Rad-App to
`workspaces`. Workspace apps use Node's built-in runner through
`tsx --test`. Root `AGENTS.md` §2 says no Jest is installed anywhere;
§1 and `apps/Rad-App/package.json` are the current fact for that app.
Do not install Jest, Vitest, Playwright, or Cypress into a workspace to
make a test convenient.

If the dependency or the local Postgres harness cannot start, report
**NOT RUN** and the reason. Do not substitute another command or a
production service.

## Execute and diagnose

1. Record the baseline command, the specs it selected, and pass or fail
   before changing behavior. "No adequate test" is a valid baseline.
2. When characterization is required, those tests are the first test-only
   commit and are run against pre-change code. Keep that result in the PR.
3. Assert the behavior that matters: success, rejection, permission,
   boundary, retry, and concurrency when the code has those paths. Do not
   lock the test to incidental markup.
4. Run the smallest command first, then the broader suite the change can
   affect. Record exit codes. Separate a confirmed regression from a
   harness or environment failure. Do not weaken a test to get green.
5. Read `git diff` for unrelated edits and for secrets or live customer
   data in fixtures.

A local pass is not the GitHub check `CI passed`. The `main` ruleset
requires that check on a head that is up to date with the base. The
workflow is `.github/workflows/ci.yml`; the job list is also in the
task-to-PR workflow. Report CI only for a run you actually saw on this
head. A docs-only change still runs that workflow.

## Human gates

Do not invent a business rule so a test can pass. Ambiguity in payment,
inventory, authentication, authorization, or database behavior stops for
a person (`AGENTS.md` §13). A change in an `AGENTS.md` §9 area needs
explicit human approval before merge, from a reviewer other than the
implementing agent. Do not approve your own change, mark the PR ready,
merge, deploy, or change production data from a test task.

## Final evidence report

- Worktree, branch, HEAD, and files changed.
- Risk class and readiness: READY / NEEDS TESTS / NEEDS DECISION / BLOCKED.
- Behavior matrix: what was asserted, and what was left out of scope.
- Pre-change baseline. When characterization applies, say whether those
  tests ran on the pre-change code.
- Exact commands, exit codes, and **NOT RUN** reasons. Separate
  **inspected**, **tested**, **manually verified**, and **not verified**.
- Coverage gaps, harness limits, and remaining risks.
- Whether human approval is still required.
- `CI passed` for this head, or **not verified** when you did not see it.

Inspection alone is not a passing result.
