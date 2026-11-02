---
name: rad-pr-review
description: >-
  Independent, evidence-based review of a RAD pull request or diff for
  correctness, security, regressions, tests, and release safety. Use for
  PR review, pre-merge assessment, or review of an agent-generated patch.
  A review-only task does not approve, merge, deploy, or edit code.
---

# RAD PR review

## What this skill owns

This skill owns independent review and the findings report.

- `rad-safe-refactor` owns structural-refactor safety: readiness class, the characterization commit before the structural commit, and the freeze on transaction, lock, validation, and error-code boundaries. Check whether that procedure was followed. Do not restate it or run a refactor from this skill.
- `rad-testing` owns test selection, characterization design, and the test-evidence report. Current `main` includes that skill. When `.claude/skills/rad-testing/SKILL.md` is in the reviewed tree, check the PR's evidence against it and do not restate its commands or coverage notes. A tree that predates the skill is not a finding; apply [ADR-007](../../../docs/engineering/adr/adr-007-test-first-refactoring.md), root `AGENTS.md` §§3 and 10, and [task-to-PR](../../../docs/engineering/workflows/task-to-pr.md) directly.
- Do not copy those procedures into the review.

## Review-only boundary

On a review-only task, do not edit files, commit, push, approve a GitHub review, request reviewers, merge, deploy, retarget, or mark the PR ready. Do not treat your own patch as an independent review. A separate task that explicitly authorizes an update is not this review. This skill never grants permission to merge.

## Exact target

1. Fetch. Record the repository, PR URL and number, draft state, GitHub base ref, **base SHA**, head ref, **head SHA**, and whether the PR is independent or stacked. Review those SHAs. A branch tip that moved after the fetch is a different target.
2. Review the complete PR diff: `git diff <baseSha>...<headSha>` and the full changed-file list. Read callers and consumers the diff can affect. Name files you did not open.
3. **Independent PR.** The default base is the latest `origin/main`. Review only that three-dot diff.
4. **Stacked PR.** Review only changes reachable from `headSha` and not from the declared base SHA. Do not report the dependency's diff as findings of this PR. Confirm the declared base is still the dependency these commits need.
5. A historical foundation branch, a base that is not that dependency, or a head that does not contain current `main` after the dependency has merged, is a merge-readiness finding. Report it. Do not retarget during a review-only task. A green check on an older SHA does not cover a new head.
6. Read `git status --short` before any local command. Do not switch, reset, or commit on an unrelated worktree. If GitHub access or the diff is incomplete, say **not verified**.

## What to read

From the reviewed tree: root `AGENTS.md`, the touched app's `AGENTS.md`, ADRs whose subject matches the diff, and `docs/engineering/workflows/task-to-pr.md` when that file exists. Current source wins over audit notes and architecture docs. Treat the PR body and the author's test claims as claims to check.

## Priority

Correctness, security, regressions, and business invariants come before style. Do not file formatting or lint comments that CI already enforces, unless they hide a behavior bug.

Where the diff touches them, check:

- Authentication, authorization, and ownership (`AuthGuard`, `AdminGuard`, `session.middleware.ts`). Re-derive ownership, availability, and price on the server.
- Validation and structured error `code`s. The tracking-number business rule is `normalizeTrackingNumber`. DTO `MaxLength` is only a sanity bound.
- Transaction boundaries, `pessimistic_write`, inventory holds and the reservation window, receipt idempotency, duplicate receipt and tracking checks, submission caps, and payment or gateway verification. A move or rename is not evidence those survived.
- API contracts used by storefront and admin, including Persian `message` text the UI already branches on.
- 1/1 availability. A disabled control is not the lock.
- Migrations, secrets, generated artifacts, and isolation of `apps/Rad-App`.

For a structural refactor, require the `rad-safe-refactor` evidence: readiness class, characterization tests of **observed** behavior that passed on **pre-change** code ([ADR-007](../../../docs/engineering/adr/adr-007-test-first-refactoring.md)), and unchanged lock, transaction, validation, and error-code boundaries. Missing evidence is the finding. Do not invent the functional bug the evidence might have caught.

## Tests and CI

- Judge whether tests pin the behavior this diff can break, including rejection and authorization paths that the code has. A characterization assertion that was loosened to fit the new code is a finding.
- Missing coverage is a test-gap finding. It is not proof the production code is wrong, and a passing suite is not proof the gap does not matter.
- Do not claim a command passed unless you ran it, or you read a log for **this head SHA**. Otherwise write **not verified**.
- `CI passed` means the jobs in `.github/workflows/ci.yml` succeeded for that SHA. It does not prove a UI flow, a pre-change characterization run, or a production deploy. The `main` ruleset requires that check on a head that is up to date with the base. A red job is not automatically this diff's fault: name the job and compare it with the base when the logs are available. Do not invent a green result.
- When `.github/workflows/ci.yml` in the reviewed tree has the Lint step `RAD skill mirrors`, that job runs `node scripts/check-agent-skill-mirrors.cjs`. If that step is absent, do not say the check ran.

## Skill mirrors and discovery

For a `rad-*` skill edit, `.claude/skills/<name>/SKILL.md` is canonical. The `.agents/skills/` and `.cursor/skills/` copies must be byte-identical files, not symlinks. Frontmatter `name` must equal the directory name, and `description` must be non-empty. When `scripts/check-agent-skill-mirrors.cjs` is in the tree, run it and record the exit code. A pass proves bytes and frontmatter shape only.

[ADR-008](../../../docs/engineering/adr/adr-008-agent-engineering-system.md) still says no script keeps the mirrors in sync. Prefer the script that is actually in the reviewed tree. Do not edit the ADR from a review.

Native discovery follows `docs/engineering/workflows/skill-discovery.md` when that file is in the tree. **VERIFIED** requires this session's own listing and a successful native invoke. Reading `SKILL.md` is **MANUAL FALLBACK**. File presence does not verify Claude Code, Cursor, Codex, or any other tool.

## Release and human approval

- Read migration files in the diff. A schema change needs the justification in `AGENTS.md` §8. Do not run migrations.
- A push to `main` starts `.github/workflows/deploy.yml`, which deploys only the services its path filter marks. Docs-only paths do not deploy. State the impact from the workflow in the reviewed tree, or **not verified** if you did not read it. Do not deploy, roll back, SSH, or edit deploy configuration.
- Rollback for this class of change is reverting the PR. Say so. Do not weaken production config to make a revert easier.
- An `AGENTS.md` §9 area needs explicit human approval before merge, from a person other than the implementing agent. This review does not supply that approval. If `rad-safe-refactor` would stop for a Tech Lead decision, the recommendation stays **BLOCK** until that decision is recorded. Ambiguous payment, inventory, authentication, authorization, or database behavior stays **BLOCK** (`AGENTS.md` §13). Do not invent the business rule.

## Findings

- **P0 Blocker** — exploitable issue, data loss, or a merge that is unsafe now.
- **P1 High** — a concrete correctness or security regression on a critical path.
- **P2 Medium** — a credible bug, missing characterization or test coverage for behavior this diff can break, or a boundary break that should be fixed before merge.
- **P3 Low** — maintainability or docs, not a behavior bug.

Each finding names the file and line or the diff hunk, the observable failure, why it matters, and the smallest fix. Label uncertain items **needs verification**. Do not file a bug you cannot point at.

## Report

- PR, base ref, base SHA, head ref, head SHA, independent or stacked, draft state.
- Findings first, highest severity first, or **No actionable findings identified**. That sentence is not "bug-free".
- Commands and CI actually observed on this head. Separate **inspected**, **tested**, **manually verified**, and **not verified**.
- §9 gate: required and still pending, or not applicable. This review did not approve it.
- Deploy impact and rollback.
- What was not inspected.
- Recommendation: **BLOCK**, **CHANGES REQUESTED**, or **READY FOR HUMAN REVIEW**. None of these merges the PR.
