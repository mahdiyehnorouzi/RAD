---
name: rad-pr-review
description: >-
  Perform an independent, evidence-based review of a RAD pull request or
  proposed diff for correctness, regression risk, architectural boundaries,
  tests, security, and release safety. Use for PR review, code review,
  pre-merge assessment, or review of an agent-generated patch.
---

# RAD PR review

## Applies to

Use for an independent review of a PR, commit series, or diff. Review-only
by default: do **not** edit files, approve GitHub checks, push commits,
merge, deploy, or mark a PR ready unless expressly authorized. Do not
review your own patch as though the review were independent.

## Establish the exact review target

1. Record repository, PR URL/number, base/head branches and immutable head
   SHA, worktree, status, draft status, and whether the PR is stacked.
2. Inspect the full diff **against the actual PR base**, including changed
   file list and relevant surrounding callers/consumers. Do not compare
   every stacked PR against `main` and report inherited changes as new.
3. Check `git status` before local read/validation; never overwrite
   existing work. If GitHub access or file context is incomplete, say so.
4. Read root and applicable app `AGENTS.md`, relevant ADRs and test scripts.
   Treat PR description and author test claims as hypotheses to verify.

## Review order

1. **Behavior and product invariants:** intended change matches request;
   check 1/1 product availability, cart holds, pricing authority, localized
   Persian/RTL UI states, and complete user flows where touched.
2. **Security and correctness:** authentication, authorization/ownership,
   data validation, upload controls, secrets, SSR boundaries, API contracts,
   handling of errors/retries, and client/server trust boundaries.
3. **Transactions and concurrency:** ensure TypeORM transaction boundaries,
   pessimistic locks, reservation windows, idempotency and gateway
   verification are preserved when applicable. Never infer safety from
   moving code alone.
4. **Architecture and scope:** ADR-001 state ownership, ADR-002/003 admin
   routing and features, ADR-004 incremental payment extraction, ADR-005
   shared package boundaries, ADR-006 shared contracts, ADR-007 testing,
   ADR-008 agent rules. Check actual current structure, not a proposed
   architecture as though it already existed.
5. **Tests:** confirm relevant baseline/characterization tests against
   pre-change code when required, test quality and negative paths, CI and
   exact command results. Consider missing coverage a finding, not proof
   of failure. Inspect CI job logs when checks fail.
6. **Release and scope:** unrelated edits, credentials, migrations,
   generated artifacts, production impact and rollback. Preserve isolation
   of `apps/Rad-App` and its own test system. New mirrored `rad-*` skills
   must be identical across `.claude/skills`, `.agents/skills`, and
   `.cursor/skills`.

## Severity and evidence

Report findings by severity:

- **P0 Blocker:** immediately exploitable critical issue, destructive
  production risk, or a clearly unsafe merge.
- **P1 High:** concrete correctness/security regression in a critical path.
- **P2 Medium:** credible bug, test gap on affected behavior, or architectural
  violation that should be addressed before merge.
- **P3 Low:** non-blocking maintainability, documentation, or ergonomics issue.

Each finding must have a precise changed-file path/line or diff hunk,
the observable failure scenario, why it matters, and the smallest
actionable correction. Avoid speculative claims and generic style
comments that existing lint/format checks already cover. Label uncertain
findings as **needs verification**, not confirmed bugs.

Do not suppress a bug just because all CI jobs are green. Conversely,
a red CI check does not prove the new diff caused it: identify the failing
job and compare baseline evidence.

## Independent review and approval

For root `AGENTS.md` §9 security-sensitive changes, require a second
review by an independent reviewer/invocation and explicit Tech Lead
approval before merge. If you are the implementing agent, flag that an
independent review is still pending. Never self-certify the gate.

A review does not authorize merging, retargeting or deploying. Existing
stacked PRs keep their requested base until separately approved.

## Expected report

- PR / base / head SHA / scope, and CI checks **actually observed**.
- **Findings first**, highest severity first, with file/line evidence and
  impact; say **No actionable findings identified** when appropriate,
  not **bug-free**.
- Tests reviewed or executed, including missing/not-run checks.
- Sensitive-area and human-approval gates.
- Residual risks / context not inspected.
- Recommendation: **BLOCK / CHANGES REQUESTED / READY FOR HUMAN REVIEW**
  (not permission to merge).

Explicitly distinguish **inspected**, **tested**, **manually verified**
and **not verified**.
