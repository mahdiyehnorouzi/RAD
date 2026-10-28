---
name: rad-safe-refactor
description: >-
  Structural, behavior-preserving refactor of an existing RAD module
  (e.g. orders.service.ts, admin-dashboard.tsx, cart.service.ts) without
  changing observable behavior. Use when a task is "extract", "split",
  "decompose", "clean up", or "reorganize" an existing file or module,
  not when adding a new feature or fixing a reported bug. Implements the
  test-first and human-approval rules in docs/engineering/adr/adr-007-test-first-refactoring.md
  and docs/engineering/adr/adr-004-orders-gateway-extraction.md procedurally.
---

# RAD safe refactor

## When this skill applies

Use this skill when a task is purely structural: moving, splitting, or
reorganizing existing code with no intended change in behavior. Do **not**
use it for a feature change, a bug fix, or a change whose correct
end-state is still being decided (that belongs in Plan mode or a design
discussion, not a refactor).

This skill assumes the target area is one the repository's audit (see
`docs/engineering/adr/`) has already classified, or that you will classify
it yourself using the same method before proceeding:

- **READY** — adequate tests exist and the design is settled. Proceed.
- **NEEDS TESTS** — architecture is understood but regression protection
  is insufficient (e.g. `apps/api/src/cart/`, `admin-dashboard.tsx`).
  Write characterization tests first, as their own commit, before any
  structural change.
- **NEEDS DECISION** — a design choice requires Tech Lead approval before
  implementation (e.g. admin routing shape, whether `checkout()`'s
  gateway-start call moves). Stop and surface the open ADR; do not guess.
- **BLOCKED** — missing evidence or unresolved production risk. Stop and
  report what's missing; do not proceed on an assumption.

If you are unsure which classification applies, treat the area as
**NEEDS TESTS** by default — the safe failure mode is writing an extra
test, not skipping one.

## Required repository context

Before making any change, read:

- The root `AGENTS.md`, and the target app's `AGENTS.md` (if it has
  hand-maintained content below any framework-regenerated block).
- Any ADR under `docs/engineering/adr/` whose title matches the area
  being touched.
- The existing test files for the target module (`*.spec.ts` in the same
  directory or a clearly related one) — their absence is itself a
  finding, not something to infer.
- `git status` / `git diff` on the target files, to check for existing
  uncommitted work before touching them (per this repo's general safety
  rules — never discard uncommitted changes without checking first).

## Scope and risk assessment

State explicitly, before writing any code:

1. What is being extracted/moved/split, and what is deliberately **not**
   being touched in this pass.
2. Whether the target file/module is listed in `AGENTS.md` §9
   (Security-Sensitive Areas: auth, admin endpoints, order ownership,
   payment confirmation, receipt uploads, unique product reservation,
   product sold state, file uploads, pricing, inventory). If yes, this
   refactor requires explicit human approval before merge — say so up
   front, do not discover it at the end.
3. Whether any transaction boundary (`dataSource.transaction(...)`) or
   lock (`pessimistic_write`) is anywhere near the change. If yes, state
   explicitly that the boundary/lock scope will not change, or flag that
   it must and stop for a decision — do not let a transaction boundary
   shift as an unnoticed side effect of moving code.

## Baseline verification

Before changing anything:

1. Run the smallest relevant existing test command for the target area
   (per `AGENTS.md` §3's command table — do not invent a command).
2. Record the result (pass/fail, and which spec files ran) as the
   baseline. If no test exists for the target area, this step's output
   is "no baseline exists" — proceed to Characterization-test
   requirements below, not past them.

## Characterization-test requirements

If the target area is **NEEDS TESTS** (no adequate existing coverage):

1. Write tests that pin **current, observed behavior** — including
   current edge cases and error paths — not the intended post-refactor
   behavior. These are two different things; conflating them defeats the
   purpose of a characterization test.
2. Run these new tests against the **pre-refactor** code and confirm they
   pass before making any structural change. This confirms the tests
   describe what the code actually does, not what you assume it does.
3. Only after that, proceed to implementation.

## Incremental implementation rules

- Make the smallest change that accomplishes one unit of the extraction;
  prefer several small, reviewable commits over one large rewrite.
- Never change a transaction boundary, lock scope, validation rule, or
  error-handling behavior as a side effect of moving code — if the
  refactor seems to require one of these to change, stop and treat it as
  a **NEEDS DECISION** item, not a detail to resolve inline.
- Do not rename files or symbols "for consistency" beyond what the
  specific extraction requires — scope discipline (`AGENTS.md` §11)
  applies to refactors as much as to features.
- Do not perform the refactor across multiple unrelated modules in one
  pass; one module (or one domain, for admin) per PR.

## Validation commands

Run, in order, only what's relevant to the touched area (per `AGENTS.md`
§3 — do not invent commands):

1. The smallest relevant spec file(s) first.
2. The broader suite for the touched app (`npm run test` for that
   workspace, or the root `npm run test` if the change crosses apps).
3. `npm run typecheck:all`.
4. `npm run lint`.

Record each command's result. A refactor is not complete if any of these
were skipped — state explicitly which were run and which were not,
rather than implying full coverage.

## Independent review expectations

- The implementing agent must not be the only reviewer of a change to a
  §9 security-sensitive area. Flag for a second pass (human, or a
  separate review-only invocation) rather than self-certifying.
- Review should explicitly re-check: did any transaction/lock boundary
  move? Did any validation rule change? Do the characterization tests
  still assert pre-refactor behavior, or were they quietly loosened to
  make the new code pass?

## Human approval requirements

Per `AGENTS.md` §9 and §13: explicit human approval is required before
merging any refactor touching authentication, admin endpoints, order
ownership, payment confirmation, receipt uploads, unique-product
reservation, product sold state, file uploads, pricing, or inventory —
regardless of how mechanical the change looks. "Looks mechanical" has
already been wrong once in this codebase (the catalog storage-kind
whitelist incident documented in `product-image.entity.ts`).

## Expected final report

Structure the report using the existing `AGENTS.md` §12 workflow
(Investigate / Plan / Implement / Validate / Report), with this skill's
additions made explicit:

- **Root cause / objective**: what was extracted and why.
- **Readiness classification used**: READY / NEEDS TESTS / NEEDS DECISION
  / BLOCKED, and why.
- **Baseline**: what existing tests showed before the change (or "none
  existed" and what characterization tests were added).
- **Files changed**: full list.
- **Transaction/lock/validation boundaries**: explicitly confirmed
  unchanged, or flagged as a decision point.
- **Tests/checks executed**: exact commands run and their results —
  distinguish **inspected**, **tested**, **manually verified**, and
  **not verified**, per `AGENTS.md` §10.
- **Security-sensitive-area flag**: yes/no, and if yes, that human
  approval is pending before merge.
- **Remaining risks**: anything deferred or not covered by this pass.

<!-- intentional mismatch for negative CI test; never merge -->
