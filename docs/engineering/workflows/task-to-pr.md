# RAD Agent Task-to-PR Workflow (v1)

**Status:** proposed operating procedure; no automated orchestration or CI approval gate is implemented by this document.

References: [ADR-007](../adr/adr-007-test-first-refactoring.md), [ADR-008](../adr/adr-008-agent-engineering-system.md), root `AGENTS.md`, and the `rad-safe-refactor` skill.

## 1. Intake and risk gate

Collect the task's intended behavior, affected app(s), exclusions, acceptance criteria, and whether it is feature work, a bug, or a behavior-preserving refactor. Inspect the repo and current branch before proposing changes. For uncertain business rules, ask the Tech Lead instead of making assumptions.

Classify **critical** (payment, orders, inventory, auth, access control, database, media authorization), **high** (cart/checkout/admin order handling), **medium**, or **low**. Critical/high refactors need adequate characterization tests before structural changes. Record explicit human sign-off requirements.

## 2. Plan and isolated workspace

Prepare a focused plan with owner/module map, expected files, risk, baseline test commands, and verification/rollback. One narrowly scoped branch or worktree per task. Do not discard or rewrite unrelated working-tree changes.

While the Engineering Foundation is pending on `main`, branch from `docs/engineering-foundation` and open draft PRs **with base `docs/engineering-foundation`**, not `main`. Use sibling branches from the Foundation head for independent work; use a dependent branch's head only when work genuinely builds on another unmerged PR. Do not merge or deploy from these instructions.

## 3. Implement and validate

1. Record baseline behavior and test results first.
2. Add regression/characterization tests at the policy-required point.
3. Make the smallest coherent change; never silently alter transactions, concurrency, auth, error codes, or backend contracts.
4. Run relevant narrow tests before broader checks. Run lint/typecheck and any affected build/format checks using commands verified in repository scripts.
5. Document actual results separately as **inspected**, **tested**, **manually verified**, and **not verified**.

## 4. Independent review and PR

An independent review pass checks scope, tests, behavior preservation, security boundaries, API contracts, and cross-app impact. Open a **draft** PR with task objective, changed files, risks, commands/results, visual checks, rollout/rollback considerations, and remaining questions. Human approval is required for sensitive areas; no agent may approve its own sensitive change.

## 5. Stacked-PR integration sequence

- Foundation PR #112 targets `main` and remains unmerged until the Tech Lead approves final integration.
- Independent follow-on PRs target `docs/engineering-foundation`. Review each PR against **that base** so its diff excludes the Foundation.
- Before the final integration, verify each PR's CI/checks and merge the approved follow-on PRs into the Foundation branch in a controlled order. Then refresh #112 and re-run the required checks. Do not assume a check green on an earlier commit covers the final head.
- Once ready and allowed by branch protection, Squash Merge the Foundation PR into `main`, ensuring the final integrated change is reviewed. Never bypass a missing required status check.
- If a PR is retargeted, inspect the new diff and checks before approving. If there are conflicts or drift, stop and request review.

## Task completion report

Provide: PR URL and target base; exact changed files; intended vs. observed behavior; baseline/new tests with commands and results; independent review result; risk and required approvals; remaining work. A created branch or a passing format check does not mean a feature is complete.
