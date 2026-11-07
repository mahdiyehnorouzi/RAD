# RAD-039 — PDP purchase CTA shared pending

- **Audit status:** Partial (browser QA not run)
- **Branch:** `feat/rad-039-pdp-purchase-state`
- **Evidence (2026-11-07):** PDP `ProductDetail` lifts `addPending` and passes it to inline `ProductSummary` and `ProductFloatingBuy`. Opt-in `AddToBag` `pending` + `components/catalog/add-to-bag-pending.ts` keeps both CTAs disabled with busy copy/`aria-busy` while either cart `add()` is in flight; floating bar mirrors pending with spinner chrome when the peer CTA initiated the request.
- **Unit tests:** `features/product-detail/pdp-add-pending.spec.ts`, `purchase-view.spec.ts` (unchanged behavior).
- **Not verified:** manual/browser pass across available / in-bag / reserved / sold / scroll-during-add; cart-page button parity (out of scope for this change).
- **PR track:** PR-4
