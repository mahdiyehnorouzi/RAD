# ADR-004: Incrementally extract Orders and Gateway Payment responsibilities while preserving existing behavior

**Status:** Accepted

## Context

`apps/api/src/orders/orders.service.ts` is 981 lines and owns `checkout`
(L108), `confirmPayment` (L251), `verifyGatewayPayment` (L372),
`verifyAndApplyGatewayResult` (L430), `retryGatewayPayment` (L579),
`cancel` (L805), plus private helpers (`assertReceiptNotReused` L916,
`lockOwnedOrder` L950, `ownedOrder` L968) — six `dataSource.transaction`
blocks and two `pessimistic_write` lock sites in one class. `AGENTS.md`
already warns against changing this file "without understanding the full
purchase flow end to end."

The audit (Phase 03) found `checkout()` specifically combines, in ~140
lines: a `pessimistic_write` lock on `Product` rows, price re-snapshotting
from locked rows, `Order`/`OrderItem`/`PaymentIntent` creation, inventory
reservation, cart cleanup — all in one transaction — followed by a
**post-commit** gateway-session start in its own try/catch. This is
intrinsic coupling (the gateway start must happen after the order is
durably created), not an accidental merge of unrelated concerns, and the
current branch (`feat/checkout-redesign-zarinpal`) is actively modifying
this exact area.

Test coverage here is the strongest in the repository
(`purchase-flow.spec.ts` 551 lines, `gateway-payment.spec.ts` 698 lines).

## Approved Decision

Extract gateway-payment-specific methods (`verifyGatewayPayment`,
`verifyAndApplyGatewayResult`, `retryGatewayPayment`, and the gateway
portions of `cancel`) into a dedicated service (e.g. `GatewayPaymentService`)
**within the existing `orders` module** — not a new top-level API module.
`checkout()`'s post-commit gateway-start call is deferred: whether it moves
with the extraction is a separate, later decision, not bundled into the
first extraction PR, because it changes the transaction/error-boundary
shape and requires its own characterization tests.

Extraction must happen in small, behavior-preserving steps, each verified
against the existing `purchase-flow.spec.ts` / `gateway-payment.spec.ts`
suites before and after, and must not begin until `feat/checkout-redesign-zarinpal`
has merged, to avoid compounding merge conflicts in the highest-risk file
in the codebase.

## Rationale

Smaller blast radius first (extract already-separable gateway-verification
methods) defers the harder question (whether `checkout`'s gateway-start
call moves) until the simpler extraction has proven the approach is safe.
Keeping the extraction inside the `orders` module avoids a module-boundary
change that the audit found no evidence of needing.

## Trade-offs

- `checkout()` itself stays large after this first extraction; a "real"
  full split (moving the gateway-start call too) is deferred, meaning the
  P1 file-size concern is only partially addressed by the first PR.
- Waiting for the active branch to merge delays this work, but proceeding
  concurrently risks exactly the kind of conflicting concurrency fix the
  recent commit history (`d36e04a4`, `75aae159`, `c1a5f536`, `b59c39dd`)
  shows this file requires careful, sequential handling of.

## Consequences

- This PR does not touch `orders.service.ts`. Implementation is a future,
  separately reviewed PR.
- `AGENTS.md` §5 (Payment lifecycle) remains the operative rule in the
  interim; this ADR does not relax it.

## Implementation Constraints

- No application code changes in this PR.
- The implementation PR must not alter any `dataSource.transaction`
  boundary or lock scope as a side effect of the extraction — moving code,
  not changing when locks are acquired or released.
- Must preserve `AGENTS.md` §5's documented state-machine transitions
  exactly (`pending_payment` → `pending_verification` → `confirmed`/`rejected`).

## Verification Expectations

- `purchase-flow.spec.ts` and `gateway-payment.spec.ts` must pass unchanged
  (test *assertions*, not just test *files*, must not need modification to
  pass) before the extraction PR can merge — any required test change is a
  signal the extraction altered behavior and must be explained, not
  silently accepted.
- Explicit human approval required before merge (AGENTS.md §9: Payment
  confirmation and Order ownership are security-sensitive areas).
