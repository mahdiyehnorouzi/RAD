# Storefront Architecture

Status: **current architecture**, with one approved-but-not-yet-documented
convention noted (ADR-001).

## Directory responsibilities (current)

- `lib/` — business logic: `api/`, `catalog/`, `payment/`, `identity/`,
  plus pure utilities (`money.ts`, `qr.ts`, `seo.ts`). Confirmed zero
  `any` usages anywhere under `lib/`, `features/`, `components/`.
- `features/` — page-level composition: `cart`, `collaboration`, `home`,
  `product-detail`, `studio`.
- `components/` — UI organized by domain: `checkout`, `commerce`,
  `account`, `catalog`, `orders`, `passport`, `making`, `workshop`.
- `hooks/` — cross-cutting hooks, e.g. `use-making-workspace.tsx`.
- `i18n/`, `types/`.

No `lib/` → `features/`/`components/` import was found in the sampled
checks — the described layering holds up in practice.

## State ownership (current, codified by ADR-001)

Two shared-state tools coexist with no prior documented rule:

- **React Context**: `features/cart/cart-provider.tsx` — a subtree-shared
  client view over the checkout flow. The underlying cart data is
  **server-owned** (`apps/api/src/cart/cart.service.ts` persists it in
  Postgres and couples every mutation to inventory holds); the Context
  provider is a client-side cache of that server state for the checkout
  subtree, not itself the server-state cache strategy.
- **Zustand**: `features/product-detail/transition/product-transition-store.ts`
  and `hooks/use-making-workspace.tsx` — both shared, client-only state
  with no server counterpart.

**ADR-001** codifies the rule for new features by state type (local →
`useState`/`useReducer`, subtree-shared → Context, shared client-only →
Zustand, server → the existing data-fetching layer, URL state → route/
search params, form state → form-local state) rather than a single
Context-vs-Zustand axis. This is a documentation change, not a migration
and not a new dependency — existing code already matches the refined
rule.

## Component scale (evaluated, not flagged as a problem)

`checkout-payment.tsx` (517 lines) and `commerce-provider.tsx` (438 lines)
are the largest files in the app. Both are domain-scoped to one concern
(checkout, commerce state) rather than obviously mixing unrelated
responsibilities — size alone was not treated as evidence of poor
architecture, per the audit's explicit instruction. Worth watching as the
current `feat/checkout-redesign-zarinpal` branch adds state, but not
flagged for extraction in this PR.

## Testing boundary (current)

`knip` watches `apps/storefront` only for dead exports/code. No
component-level tests exist for checkout/payment UI, consistent with no
DOM-testing library being installed — a known, accepted scope limit of
current tooling, not a gap this PR proposes closing.

## Target (approved, not yet implemented)

None beyond ADR-001's documentation — no structural change to storefront
directory layout is proposed by any accepted ADR.
