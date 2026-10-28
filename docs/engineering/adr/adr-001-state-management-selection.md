# ADR-001: Select state management by state ownership and scope

**Status:** Accepted

## Context

`apps/storefront` mixes two state tools with no documented rule for when to
use which:

- Cart state is implemented with React Context
  (`apps/storefront/features/cart/cart-provider.tsx`). The 2026-10 audit
  (Phase 03) confirmed the cart is **server-owned**: `apps/api/src/cart/cart.service.ts`
  persists `CartItem` rows in Postgres and couples every mutation to
  inventory holds (`InventoryService.hold()` / `releaseCartHolds()`). The
  Context provider is a client-side cache over that server state, not the
  source of truth.
- PDP image transitions (`features/product-detail/transition/product-transition-store.ts`)
  and the custom-order "making" workspace (`hooks/use-making-workspace.tsx`)
  use Zustand for state that is purely client-local and ephemeral.

No README, AGENTS.md, or code comment anywhere in the repository states a
rule for choosing between the two for a *new* feature. Both existing choices
are individually defensible; the gap is the absence of a stated convention.

## Approved Decision

Select state management by **where the data is owned and how long it
lives**, not by habit or precedent of the nearest existing file:

- **Server-owned or cross-navigation state** (state that mirrors a backend
  resource, or must survive across route changes within a session) →
  **React Context**, following the existing `cart-provider.tsx` pattern.
- **Ephemeral, client-only UI state** scoped to one feature or interaction
  (transition flags, in-progress editor/workspace state not yet persisted)
  → **Zustand**, following the existing `product-transition-store.ts` /
  `use-making-workspace.tsx` pattern.

This codifies the existing split; it does not require migrating any
existing code.

## Rationale

The existing usages already follow this line exactly, by coincidence or
earlier unwritten convention — codifying it costs nothing and prevents the
next feature from picking arbitrarily.

## Trade-offs

- Some state will sit at the boundary (e.g. optimistic UI updates ahead of
  a server write) and will require a judgment call; this ADR does not
  remove the need for engineering judgment, only narrows the default case.
- Standardizing on a single tool for everything was considered and
  rejected: it would force a rewrite of working, untested-but-stable code
  (cart) for no measurable benefit, violating the audit's scope-discipline
  finding (`AGENTS.md` §11).

## Consequences

- `apps/storefront/AGENTS.md` (appended section, see Step 4 of this PR)
  states this rule for future features.
- No code changes are required by this ADR alone.

## Implementation Constraints

- Do not retroactively migrate `cart-provider.tsx` or the existing Zustand
  stores to match this rule "for consistency" — they already match it.
- Any new feature introducing state must justify its choice against this
  rule in the PR description if the classification is not obvious.

## Verification Expectations

- Code review checklist item: "If this PR introduces new state, does it
  follow ADR-001's ownership test?" — enforced by the `rad-safe-refactor`
  skill's scope section and, in a future PR, by a lint/review-only CI
  comment (not implemented in this PR — see ADR-008 and `AGENTS.md` §CI).
