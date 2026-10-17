# RAD Bug Report (QA Audit)

## Security Findings (Phase 2)

Priority-1 security re-verification, read-only, 2026-10 audit. Each item below
was checked by reading the actual controller/service/guard/DTO/entity code
end to end — no speculation.

### 1. CommissionsController / CommissionsService — ownership enforcement

**Verdict: NO ISSUE FOUND.**

Customer-facing routes (`apps/api/src/commissions/commissions.controller.ts`)
all resolve identity server-side via `IdentityService.fromRequest` (session
cookie/JWT, not client-supplied) and call into service methods that enforce
ownership:
- `GET /commissions/:id` → `getMine` → `requireOwned` (commissions.service.ts:51-54, 213-222)
- `PUT /commissions/:id` → `saveMine` → `requireOwned` (commissions.service.ts:79-95)
- `POST /commissions/:id/messages` → `addMineMessage` → `requireOwned` (commissions.service.ts:102-110)
- `GET /commissions` → `listMine` filters by `ownerKey` in the `WHERE` clause (commissions.service.ts:34-41)

`requireOwned` (commissions.service.ts:213-222) loads the row by `id` alone,
then throws `ForbiddenException` unless `row.ownerKey` matches the caller's
own `ownerKey` (user:`<id>` or guest:`<guestId>`, both derived server-side —
see item 5). So even though commission IDs are sequential/low-cardinality
(~900 possible per the prior audit's flag), enumerating IDs gains nothing:
every customer-facing read/write re-derives the caller's identity and checks
it against the stored owner before returning or mutating data.

The admin/workshop side (`listWorkshop`, `saveWorkshop`, `getAdmin`,
`saveAdmin`, `beginReview`, `decide`, `addArtistMessage`) intentionally has no
per-row ownership check, but these are exposed only via
`apps/api/src/admin/admin.controller.ts`, which carries a controller-level
`@UseGuards(AdminGuard)` (admin.controller.ts:50) plus a maker/role check
(`requireMaker`, commissions.service.ts:199-211) for the `/commissions/workshop*`
routes — by design, workshop staff need to see all commissions, not just
their own.

**Conclusion**: the prior audit's "possibly missing ownership enforcement"
flag does not hold up against the actual code — ownership is checked on every
customer-reachable commission endpoint.

---

### 2. ContactService.replyAsCustomer — conversation ownership

**Verdict: NO ISSUE FOUND.**

`apps/api/src/contact/contact.service.ts:174-201` (`replyAsCustomer`):
1. Resolves the thread root via `findRoot` (contact.service.ts:129-142),
   which also follows `parentId` to the canonical root if a reply id was
   passed instead of the root id.
2. Computes the caller's own `ownerKey` from the authenticated session
   (`this.identity.key(actor)`, line 176) — never from a client-supplied
   field.
3. Line 177-179: throws `ForbiddenException("این گفت‌وگو متعلق به شما نیست.")`
   unless `root.ownerKey === ownerKey`.
4. Only after that check does it save the reply and return `listThread`
   (full message history for that thread) — so message history is never
   exposed to a non-owner either.

The companion method `listThreadsForOrder` (contact.service.ts:213-227) has
the identical pattern for the order-scoped thread listing: `order.ownerKey`
is compared to the caller's own key before any thread rows are returned.

`replyAsAdmin` (contact.service.ts:145-171) correctly has no ownership check,
but is reachable only through the `AdminGuard`-protected admin controller.

---

### 3. AdminService.updateOrder — status transition validation

**Verdict: NO ISSUE FOUND.**

`apps/api/src/admin/admin.service.ts:252-310` (`updateOrder`) enforces an
explicit server-side state machine:
- `canManuallyTransitionOrder(currentStatus, nextStatus)` (backed by
  `MANUAL_ORDER_TRANSITIONS` in `apps/api/src/orders/const/order-status.ts:29-39`)
  is checked before any mutation (admin.service.ts:268-277). If the
  transition isn't in the allow-list, the request is rejected with a
  `BadRequestException`.
- `MANUAL_ORDER_TRANSITIONS` explicitly maps `confirmed`/`rejected` as
  **unreachable from this endpoint** — `pending_payment` and
  `pending_verification` may only manually transition to `cancelled`;
  `expired`, `rejected`, `cancelled`, `returned` are all terminal (empty
  transition lists). So this endpoint cannot be used to skip payment
  verification, resurrect a rejected/cancelled/expired order, or directly
  mark an order `confirmed` (which is also what writes `Product.status: sold`
  — that write only happens via the dedicated `payment/approve` endpoint,
  `PaymentReviewService.approve`).
- admin.service.ts:268-273 additionally gives a specific, friendlier error
  when the caller tries `confirmed`/`rejected` through this route, pointing
  them at the dedicated payment-review endpoints.
- Route-level: `PATCH /admin/orders/:id` is behind `AdminGuard`
  (admin.controller.ts:50) plus `this.admin.assert(request.adminRole,
  "order.write")` (admin.controller.ts:120) — a fine-grained permission check
  on top of the coarse admin check.

---

### 4. Payment lifecycle (orders.service.ts / payment-receipt.ts / payment-review.service.ts)

**Verdict: NO ISSUE FOUND** (re-confirms AGENTS.md §5's claims; no TOCTOU gap
found between lock acquisition and status checks).

Traced `confirmPayment` (orders.service.ts:237-333) end to end:
- `lockOwnedOrder` (orders.service.ts:460-476) takes the `pessimistic_write`
  lock **and** filters by `{ id, ownerKey }` in the same query — ownership
  and locking happen atomically, not as two separate steps.
- All subsequent checks execute inside the same `dataSource.transaction`
  block, after the lock is held, so there is no window between "lock
  acquired" and "status read" where another request could mutate the row:
  idempotent-resubmit check (line ~286-291) → `assertCanSubmitReceipt`
  (line 293, impl at 385-420) → submission cap check (line 294-300) →
  `assertReceiptNotReused` (line 301-306, impl at 426-456, SHA-256
  `receiptHash` + tracking-number cross-order check) →
  `InventoryService.assertReservedFor` (line 313, inventory.service.ts:
  248-261) → the actual `PaymentIntent`/`Order` writes.
- `assertReservedFor` re-checks `Product.status === "sold" && heldBy ===
  ownerKey` **inside the same locked transaction**, so even though
  `InventoryService.releaseExpiredHolds` is also called once, unlocked,
  before the transaction starts (line ~241, a best-effort pre-sweep), a
  concurrent expiry sweep that restocks the product between the pre-sweep
  and the transaction is still caught by this in-transaction re-check — it
  throws `ConflictException` rather than letting a stale reservation through.
- 5-submission cap (`MAX_RECEIPT_SUBMISSIONS`) is read from the same locked
  `payment` row fetched after the lock, so it cannot be bypassed by
  concurrent submissions on the same order (lock serializes them).
- Duplicate-receipt-hash / tracking-number detection
  (`assertReceiptNotReused`) queries other orders' `PaymentIntent` rows for
  `submitted`/`verified` status — this does not depend on the lock on the
  *current* order and is a point-in-time check (small window: two different
  orders' confirmPayment calls could theoretically race on the same receipt
  image between this check and the `payments.update` write below it, since
  each call only locks its own order's row, not a global/receipt-level
  lock). This is a narrow, low-severity theoretical race rather than a
  confirmed vulnerability — flagged under Open Questions below rather than
  as a confirmed bug, since exploiting it requires an attacker to already
  possess another customer's exact receipt image and to race two submissions
  within the same transaction window.
- `InventoryService.releaseExpiredHolds` (inventory.service.ts:83-134) uses a
  dedicated transaction, is reused via `sweepInFlight` to avoid overlapping
  runs, and its restock/expire queries are conditioned on current DB state
  (`status = 'sold' AND holdExpiresAt <= now`), not on values read earlier —
  so concurrent sweep runs are self-consistent.

---

### 5. Guards / session middleware — identity derivation

**Verdict: NO ISSUE FOUND.**

`apps/api/src/common/session.middleware.ts:16-38`: `userId`/`userRole`/
`adminRole` are set **only** from a JWT verified server-side
(`this.jwt.verifyAsync`) against the signed `AUTH_COOKIE`; a bad/absent token
simply leaves `request.userId` unset (and clears the cookie on verify
failure) — the request is never trusted to self-report its identity.
`guestId` similarly comes from a server-set cookie, generated with
`randomUUID()` (crypto-strength, not sequential/guessable).

`IdentityService.fromRequest` (identity.service.ts:14-19) re-derives the
`Actor` from `request.userId`/`request.guestId` (never from the request
body/query), and `ownerKey(actor)` (identity.ts:14-16) is computed purely
from that server-derived `Actor`.

`AdminGuard` (common/guards/admin.guard.ts) re-fetches the `User` row by
`request.userId` and requires `user.adminRole` truthy and `user.status ===
"active"` — not just presence of a cookie.

Checked every place a client-supplied ID (order id, commission id, contact
message id) is used to fetch a row: in all cases (`orders.service.ts`
`ownedOrder`/`lockOwnedOrder`, `commissions.service.ts` `requireOwned`,
`contact.service.ts` `replyAsCustomer`/`listThreadsForOrder`) the row is
either queried with `ownerKey` as part of the `WHERE` clause, or fetched by
ID alone and then explicitly compared against the server-derived
`ownerKey`/`actor` before being returned or mutated. No endpoint was found
that trusts a client-supplied user/order ID without this cross-check.

---

## Open Questions

- **Cross-order receipt-hash race (narrow, unconfirmed)**: `assertReceiptNotReused`
  (orders.service.ts:426-456) queries *other* orders' `PaymentIntent` rows for
  a matching `receiptHash`/`trackingNumber` under `submitted`/`verified`
  status, but this check is not protected by a lock spanning both orders —
  only each order's own row is locked via `lockOwnedOrder`. Two concurrent
  `confirmPayment` calls on two *different* orders, submitted with the same
  receipt image at nearly the same instant, could both pass the
  `assertReceiptNotReused` check before either `payments.update` write lands.
  This requires an attacker to already have obtained another customer's
  exact receipt image and to win a tight race — not verified as exploitable
  in practice, and no test was run to reproduce it. Flagging for someone to
  decide whether a receipt-hash-level lock (e.g. a unique constraint on
  `(receiptHash, status)` or an advisory lock) is worth adding, per AGENTS.md
  §13 (do not silently invent a fix for an ambiguous payment-integrity rule).
- **Guest-to-user hold transfer (`InventoryService.transferHolds`,
  inventory.service.ts:303+) and `IdentityService` guest/session merging**
  were not read in depth during this pass (flagged by the Phase 1 flow
  inventory as well) — out of scope for this Priority-1 pass but worth a
  follow-up read if guest-session takeover is ever in scope.
