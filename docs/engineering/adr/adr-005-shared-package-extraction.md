# ADR-005: Use evidence-based shared-package extraction, normally requiring at least two real consumers, and enforce dependency boundaries in CI

**Status:** Accepted

## Context

`packages/state` (`@rad/state@1.5.1`, a thin Zustand wrapper) has zero
real source references in any app or other package
(`grep -rl "@rad/state"` matches only lockfiles, its own manifest, and
stale agent-worktree copies — Phase 02). It is also invisible to the
repository's existing dead-code tool: `knip.json` scopes `knip` to
`apps/storefront` only, so an unused package or app can exist indefinitely
without any automated signal. No technical justification for creating
`packages/state` was found in the repository's history or comments
available to this audit.

Conversely, `packages/types` is a genuine success: `ProductStatus` and
related helpers (`canTransitionProductStatus`, etc.) are defined once and
correctly imported by both `apps/admin` and `apps/api` (Phase 02/03).

`apps/Rad-App` (React Native) already demonstrates a working, CI-enforced
boundary pattern: `scripts/check-isolation.mjs` builds its production
bundle and fails if any module resolves from outside `apps/Rad-App`
(not from `packages/*`, the other web apps, or root `node_modules`).

## Approved Decision

1. A new shared package under `packages/` should not be created until at
   least two real, current consumers need the same code — a single
   consumer should keep the code local to that app until a second
   consumer actually appears.
2. Extend dependency-boundary enforcement in CI (not implemented in this
   PR — see Step 6/ADR-008) to:
   - run `knip` (or an equivalent dead-export/dead-package check) across
     all apps and packages, not storefront only, so an unused package like
     `packages/state` surfaces automatically; and
   - apply `apps/Rad-App`'s isolation-check pattern as a model for
     verifying that `packages/*` are not imported from `apps/Rad-App`'s
     bundle in the opposite direction.
3. Disposition of `packages/state` itself (delete vs. document a concrete
   near-term consumer) is a decision for the Tech Lead, not automated by
   this ADR — see Step 6 "Unresolved Questions" in this PR's summary.

## Rationale

The "≥2 consumers" rule is directly supported by contrasting the two real
examples in this repository: `packages/types` earned its existence by
having two consumers from the start; `packages/state` did not and has sat
unused. Automating the detection (rather than relying on someone noticing)
closes the exact gap that let `packages/state` go unnoticed.

## Trade-offs

- A strict "≥2 consumers" rule can delay genuinely good abstractions by
  one app-cycle; this is an accepted cost given the demonstrated failure
  mode (packages created and never adopted) outweighs the cost of waiting.
- Extending `knip` to the API and `apps/Rad-App` may surface noise from
  patterns `knip` doesn't understand well in a NestJS or React Native
  context; the CI implementation PR must tune configuration, not just
  flip scope on and hope.

## Consequences

- No package is created or deleted by this PR.
- A future, separate PR will extend `knip.json`'s scope and/or add an
  isolation-check equivalent for `packages/*` — explicitly deferred per
  the audit's Step 6 instruction not to introduce new CI gates in this PR.

## Implementation Constraints

- Do not delete `packages/state` in this or any PR without an explicit,
  separate Tech Lead decision — it may still be in a 2026-10 audit
  "pending use" state that this PR's evidence-gathering could not fully
  rule out.

## Verification Expectations

- The future CI-extension PR must demonstrate it flags `packages/state`
  as unused (or confirms it no longer exists) as its own acceptance
  criterion.
