# ADR-007: Apply risk-based, test-first refactoring, with stronger pre-refactor characterization-test requirements for critical flows

**Status:** Accepted

## Context

The audit's Phase 03 readiness assessment found highly uneven test
coverage across the areas most likely to be refactored next:

| Area | Test evidence |
|---|---|
| `orders.service.ts` (payment/checkout) | Strong — `purchase-flow.spec.ts` (551 lines), `gateway-payment.spec.ts` (698 lines) |
| Media/storage (`apps/api/src/storage/*`) | Strong — 5+ spec files, including `upload-intent.spec.ts`, `media-signature.spec.ts` |
| Inventory (`inventory.service.ts`) | Present — `inventory.spec.ts` |
| Cart (`apps/api/src/cart/*`) | **None** — zero spec files found for `cart.service.ts`/`cart.controller.ts`, despite triggering every inventory hold |
| `admin-dashboard.tsx` and its `lib/` dependencies (`admin-data.ts`, `admin-storage.ts`) | **None** |
| Catalog whitelist-completeness (the specific past-incident class, `SRC_LESS_IMAGE_STORAGE_KINDS`) | Unverified whether a regression test exists |

## Approved Decision

Refactor readiness is risk-based, not uniform:

- **Critical flows** (payment, order state, inventory reservation, auth,
  media/storage security controls) require a **characterization test to
  exist before any structural change**, even if the change looks purely
  mechanical. "Looks mechanical" has already been wrong once in this
  codebase (the catalog whitelist incident).
- **Lower-risk areas** (e.g. UI composition with no write-path
  consequences) may have tests written concurrently with the refactor,
  provided the PR is reviewed with that explicitly stated.
- A module with **zero tests** is classified **NEEDS TESTS**, not READY,
  regardless of how simple its current design looks — `cart.service.ts`
  is the clearest current example: simple and stable by design, but with
  no regression safety net at all.

## Rationale

The audit's own readiness matrix (Phase 03) already applies exactly this
rule in practice; this ADR makes it the stated policy rather than an
implicit judgment call repeated ad hoc per PR.

## Trade-offs

- Requiring characterization tests first slows the first touch of an
  under-tested critical module (e.g. `cart.service.ts`) relative to just
  making the change — accepted, because the alternative already produced
  one real incident in a structurally similar area (catalog whitelist).
- Over-applying "critical flow" status to low-risk areas would slow
  unrelated work for no benefit; the table above is the basis for
  classification, not a blanket rule for every file.

## Consequences

- Any future refactor PR touching `cart.service.ts`, `orders.service.ts`,
  `admin-dashboard.tsx`, or the media/storage security controls must
  either show existing adequate tests or add characterization tests as
  its first commit, before the refactor commit.
- This is the operative rule the `rad-safe-refactor` skill (Step 5 of this
  PR) implements procedurally.

## Implementation Constraints

- A "characterization test" here means a test asserting *current*
  observed behavior (including edge cases and error paths), not a test of
  the *intended* post-refactor behavior — the two are easy to conflate and
  the conflation defeats the purpose.

## Verification Expectations

- Reviewers must be able to see, in the PR, that the characterization test
  was run and passed against the pre-refactor code (e.g. in an early
  commit or the PR description), not only against the final state.
