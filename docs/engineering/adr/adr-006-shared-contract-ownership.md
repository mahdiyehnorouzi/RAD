# ADR-006: Use a single source of truth for genuinely shared contracts, while retaining API authority for runtime validation

**Status:** Accepted

## Context

The audit found both a success case and a confirmed gap in this repository:

- **Success**: `ProductStatus`, `PUBLIC_PRODUCT_STATUSES`,
  `canTransitionProductStatus`, `isPurchasableStatus` are defined once in
  `packages/types/src/index.ts` and imported directly by both
  `apps/admin/lib/admin-data.ts` (L401-406) and the API — not duplicated.
- **Gap**: `apps/admin/lib/admin-data.ts` defines its own
  `AdminOrderStatus` (L84-94) and `manualOrderTransitions` (L312-323) with
  a comment explicitly stating it *"Mirrors `MANUAL_ORDER_TRANSITIONS` in
  the API"* (L309-311) — a hand-maintained duplicate, not a shared-type
  import. `AdminProductImage`'s storage union is similarly a hand-shaped
  mirror of `ProductImage.storage`'s real type rather than an import from
  it. No technical reason for the inconsistency was found; it appears to
  be an organic gap, not a deliberate choice.

A related, already-realized risk: `product-image.entity.ts` (L30-37)
documents a past production incident where a second file's hardcoded
storage-kind whitelist (`catalog.query.ts`'s public `leftJoin`) drifted
from the entity's real enum and silently dropped rows from the public API.
This is the same failure mode as the order-status duplication, already
proven capable of causing a real bug.

## Approved Decision

For contracts genuinely shared across apps (status enums, transition
rules, storage-kind unions), the type/shape is defined **once**, in
`packages/types`, and imported — never hand-duplicated with a "mirrors X"
comment as the only safeguard.

The API remains the sole authority for **runtime validation and
enforcement** of these contracts — sharing the *type* does not mean
sharing *trust*. Admin or storefront importing a shared type must still
have their writes re-validated server-side exactly as `AGENTS.md` §8
already requires ("Never trust client-provided ownership, availability, or
pricing").

Concretely approved first targets for consolidation (to be executed as
separate, later PRs under ADR-007's test-first rule):
1. Move `manualOrderTransitions`'s shape/rules into `packages/types`,
   imported by both `admin-data.ts` and the API's order-transition logic.
2. Move `ProductImage`'s storage-kind union into `packages/types`,
   imported by `AdminProductImage` instead of hand-mirrored.

An acceptable, lower-risk interim step before full consolidation: add a
test that asserts admin's `manualOrderTransitions` matches the API's
`MANUAL_ORDER_TRANSITIONS` constant value-for-value, so drift fails CI
even before the types are unified.

## Rationale

`ProductStatus` proves the shared-type approach already works in this
codebase; the order-transition and image-storage duplicates are the
exception, not the rule, and the whitelist incident proves the exception
is not merely theoretical.

## Trade-offs

- Moving `manualOrderTransitions` into `packages/types` requires touching
  API code (security-sensitive per AGENTS.md §9) — this is real work, not
  a trivial rename, and must be done carefully with a characterization
  test first (ADR-007).
- The interim "sync test" (option above) is lower-risk and can ship before
  the full consolidation, and should be preferred as the first concrete
  step.

## Consequences

- No code changes in this PR. This ADR records the decision; the sync
  test and the eventual type consolidation are separate implementation
  PRs.

## Implementation Constraints

- Do not weaken or remove the API's own server-side validation when
  introducing a shared type — the shared type reduces *drift*, not the
  need for *server-side re-checking*.

## Verification Expectations

- The interim sync test (if implemented first) must fail loudly if admin's
  mirror and the API's constant diverge — not silently pass by comparing
  against itself.
- The eventual consolidation PR must keep `purchase-flow.spec.ts` and any
  admin order-transition tests passing unchanged.
