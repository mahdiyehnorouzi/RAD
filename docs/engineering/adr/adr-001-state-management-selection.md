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

Select state management by **state type, ownership, scope, and
lifetime** — not by a single Context-vs-Zustand axis, and not by habit or
precedent of the nearest existing file:

- **Local UI state** (toggle, input draft, hover/open flags scoped to one
  component) → `useState` or `useReducer`. No shared tool needed.
- **Subtree-shared state** (several components under one branch of the
  tree need the same value, but it doesn't need to leave that subtree) →
  **React Context**, when appropriate — e.g. the existing
  `features/cart/cart-provider.tsx`, which shares the cart's client-side
  cache across the checkout subtree.
- **Shared client-only state** (ephemeral state read/written from
  multiple, non-nested parts of the app, with no server counterpart) →
  **Zustand**, when justified — e.g. the existing
  `features/product-detail/transition/product-transition-store.ts` and
  `hooks/use-making-workspace.tsx`.
- **Server state** (anything that mirrors a backend resource — the cart's
  actual data, order status, catalog data) → the app's established
  data-fetching and cache strategy (its `lib/api` client code and
  whatever request-level caching Next.js/React already provides for it).
  **Context is not the default server-state cache** — where Context is
  used alongside server state today (e.g. `cart-provider.tsx`), Context
  holds the *client-side view* of that state for the subtree that needs
  it, not a general-purpose cache replacing the data-fetching layer.
- **URL state** (anything that should be shareable/bookmarkable or survive
  a reload — filters, pagination, selected tab) → route params and search
  params, not component or Context state.
- **Form state** → form-local state (component state or whatever
  established form-handling approach the form already uses), not global
  state of any kind.

This codifies and refines the existing split; it does not require
migrating any existing code, and it introduces no new dependency.

## Rationale

The previous draft of this ADR collapsed "server-owned state" and
"cross-navigation state" into one Context bucket, which overstates what
Context is good for and risks agents reaching for Context as a server-
state cache in new code. The corrected model separates state by its
actual nature (local/subtree/shared-client/server/URL/form), which
matches how the existing code already behaves: `cart-provider.tsx`'s
Context value is a client-side reflection of server-owned cart data for
the checkout subtree, not itself the cache strategy for that data; the
two Zustand stores are genuinely shared-client-only state with no server
counterpart.

## Trade-offs

- This is a finer-grained model than a single Context-vs-Zustand
  dichotomy, so it requires slightly more judgment to classify a given
  piece of state correctly; the trade-off is accepted because the
  coarser model was actively misleading about server state.
- Standardizing on a single tool for everything was considered and
  rejected: it would force a rewrite of working, untested-but-stable code
  (cart) for no measurable benefit, violating the audit's scope-discipline
  finding (`AGENTS.md` §11).
- No new dependency is introduced by this ADR; "established data-fetching
  and cache strategy" refers to whatever the storefront already uses for
  server data today, not a new library.

## Consequences

- `apps/storefront/AGENTS.md` (appended section, see Step 4 of this PR)
  states this rule for future features.
- No code changes are required by this ADR alone.

## Implementation Constraints

- Do not retroactively migrate `cart-provider.tsx` or the existing Zustand
  stores to match this rule "for consistency" — they already match it.
- Do not introduce a new state-management dependency to satisfy any
  category above; use `useState`/`useReducer`, React Context, the
  existing Zustand dependency, and the app's existing data-fetching code.
- Any new feature introducing state must justify its choice against this
  rule in the PR description if the classification is not obvious.

## Verification Expectations

- Code review checklist item: "If this PR introduces new state, does it
  follow ADR-001's ownership test?" — enforced by the `rad-safe-refactor`
  skill's scope section and, in a future PR, by a lint/review-only CI
  comment (not implemented in this PR — see ADR-008 and `AGENTS.md` §CI).
