---
name: rad-testing
description: >-
  Select, characterize, execute, and report appropriate tests for a RAD change.
  Use for test planning, regression protection, baseline verification,
  writing characterization tests, or diagnosing test failures. Follow
  risk-based testing ADR-007 and repository AGENTS.md; do not invent tools.
---

# RAD testing

## Applies to

Use when designing or implementing tests, assessing coverage for a proposed
change, running baseline checks, or diagnosing a failed test. For purely
structural changes, coordinate with `rad-safe-refactor`. Read applicable
`AGENTS.md`, relevant ADRs (especially
`docs/engineering/adr/adr-007-test-first-refactoring.md`), package scripts,
and existing tests before selecting commands.

## Session and safety preflight

1. Record working directory, Git branch, HEAD, and `git status --short`.
   Verify the current worktree contains the requested changes and relevant
   rules; skill availability in another worktree proves nothing here.
2. Inspect the target implementation and actual callers, existing nearby
   tests, test utilities, and package scripts. Do not guess test coverage.
3. Classify risk: **critical** for payment, authentication/authorization,
   order ownership, inventory and 1/1 product availability, pricing, media
   security, and database state; otherwise characterize the actual risk.
4. Identify irreversible side effects. Use isolated mocks/fixtures or an
   explicitly test-only ephemeral database. Never hit production endpoints,
   gateways, real customer records, or real storage for tests.

## Plan tests from behavior

State the changed behavior or preserved invariant, observable inputs/outputs,
error paths, authorization, boundaries, and concurrency where applicable.
Build a focused test matrix and explicitly list coverage gaps.

For **structural refactors in critical flows**, establish characterization
tests against **unchanged code first** (ADR-007), even where other tests exist
but do not pin affected behavior. With zero coverage classify **NEEDS TESTS**;
do not claim READY. For lower-risk UI composition, concurrent test addition
is permitted when disclosed and reviewed; do not silently use that exception
for a sensitive flow.

Characterization tests assert observed current behavior, including awkward
edge cases, not hoped-for future behavior. New behavior tests belong to
feature/bug-fix work and must not be mislabelled characterization tests.

## Choose the smallest real commands

Read `package.json` in the relevant workspace. Prefer the narrow existing
spec command first, then the relevant workspace suite, and broader checks as
needed. Existing examples (verify before using):

- `npm run test:purchase --workspace @rad/api`
- `npm run test:pricing --workspace @rad/api`
- `npm run test:media --workspace @rad/api`
- `npm test`
- `npm run typecheck:all`
- `npm run lint`

The isolated `apps/Rad-App` has its own lockfile, Jest runner, and scripts;
do not treat it as an npm workspace or bypass its isolation check. Do not
install Jest/Vitest/Playwright or another framework to make a test convenient.
If dependencies or infrastructure are unavailable, report **NOT RUN** and
why instead of quietly substituting a different test.

## Execute and diagnose

1. Record baseline command, specs run, duration/result, and any prior failure.
2. If required, add characterization tests as the first test-only commit and
   run them against pre-change code; preserve that evidence in the PR.
3. Make focused assertions: positive, negative, failure/retry, permission,
   boundary and concurrency cases when relevant. Avoid tests tied to
   incidental markup/implementation details.
4. Run the smallest tests first, then relevant broader suite, typecheck and
   lint. Capture command exit codes and distinguish flaky/environmental
   failures from confirmed regressions; never mask failures or weaken tests
   just to reach green.
5. Check `git diff` for unrelated edits and fixture/secret leakage.

## Human and review gates

Do not invent business rules to satisfy tests. Surface ambiguity to the Tech
Lead. Changes to the security-sensitive areas in root `AGENTS.md` §9 need
explicit human approval before merge and independent review. Never merge,
deploy, or alter production data as part of testing without authorization.

## Final evidence report

- Worktree/branch/HEAD and files changed.
- Risk and readiness: READY / NEEDS TESTS / NEEDS DECISION / BLOCKED.
- Behavior matrix: asserted / intentionally out of scope.
- Pre-change baseline and characterization-test evidence.
- Exact commands, specs, pass/fail and **NOT RUN** reasons.
- Coverage gaps, flaky/environment limitations and remaining risks.
- Required second review or human approval, and whether still pending.

Distinguish **inspected**, **tested**, **manually verified**, and
**not verified**; never declare success on inspection alone.
