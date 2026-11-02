# API Architecture — Current vs. Target

Status: **current architecture**, with one approved-but-not-yet-implemented
extraction (ADR-004) marked explicitly.

## Module structure (current)

One NestJS module per domain under `apps/api/src/`: `admin`,
`artist-applications`, `auth`, `cart`, `catalog`, `commissions`, `common`,
`contact`, `content`, `damage`, `database` (TypeORM entities), `design`,
`favorites`, `health`, `help`, `inventory`, `mail`, `notices`, `orders`,
`payment`, `policies`, `pricing`, `reviews`, `session`, `shape`,
`storage`. Module boundaries are sound: no production-code cross-import
was found between modules that should be independent (e.g. `catalog` does
not reach into `orders` internals, or vice versa). The one cross-module
coupling found is **test-only**: `inventory.spec.ts` imports
`orders/testing/purchase-harness`.

## Highest-risk module: `orders` (current)

`orders.service.ts` is 981 lines: `checkout` (L108), `confirmPayment`
(L251), `verifyGatewayPayment` (L372), `verifyAndApplyGatewayResult`
(L430), `retryGatewayPayment` (L579), `cancel` (L805), plus private
helpers (`assertReceiptNotReused` L916, `lockOwnedOrder` L950, `ownedOrder`
L968). Six `dataSource.transaction` blocks, two `pessimistic_write` lock
sites. `checkout()` alone combines a product-row lock, server-side price
re-snapshotting, order/item/payment-intent creation, inventory
reservation, and cart cleanup in one transaction, followed by a
post-commit gateway-session start in its own error boundary. This is the
most heavily tested code in the repository (`purchase-flow.spec.ts` 551
lines, `gateway-payment.spec.ts` 698 lines) and the subject of careful,
incremental concurrency fixes in recent commit history.

`payment-receipt.ts` (27 lines, pure functions: `normalizeTrackingNumber`,
`normalizePhone`, `receiptHash`) is a model of good isolation and the
two-layer validation pattern (`AGENTS.md` §5) — preserve as-is.

## Security-sensitive infrastructure: media/storage (current — a strength)

`apps/api/src/storage/upload-intent.ts` implements a fail-closed,
documented fix for a real gap found during SeaweedFS integration
("plausibility is not proof of authorization" — its own header comment):
it checks the durable `ProductImage` row first and falls back to a
narrow, TTL-bound in-memory intent record only for the pre-save window,
never silently accepting an unauthorized key on mismatch, restart, or
expiry. `media-signature.ts` does dependency-free byte-signature sniffing
with explicitly documented residual limits (header-only, not full decode).
Five-plus spec files cover this module — one of the best-tested and
best-reasoned subsystems in the backend.

## Confirmed historical incident (current — informs ADR-006, ADR-007)

`product-image.entity.ts` (L30-37) documents that `catalog.query.ts`'s
public `leftJoin` whitelist once omitted `seaweedfs`/`seaweedfs_video`
storage kinds, silently dropping those rows from the public API.
`SRC_LESS_IMAGE_STORAGE_KINDS` now exists to prevent recurrence. Whether a
regression test asserts whitelist-completeness against the entity's real
enum is **unverified** — not confirmed present or absent in this audit.

## Untested module (current — a confirmed gap)

`apps/api/src/cart/` (`cart.controller.ts`, `cart.service.ts`, 104 lines)
has **zero spec files**, despite being the direct trigger for every
inventory hold in the system (`CartService.add()` calls
`InventoryService.hold()`; `remove`/`clear` call
`releaseCartHolds()` inside a transaction). Simple and stable by design,
but with no regression safety net.

## Target (approved: ADR-004 — not yet implemented)

Extract gateway-payment-specific methods (`verifyGatewayPayment`,
`verifyAndApplyGatewayResult`, `retryGatewayPayment`, gateway portions of
`cancel`) into a dedicated service **within the existing `orders`
module**. `checkout()`'s post-commit gateway-start call is explicitly
**not** part of this first extraction — whether it moves is a separate,
later decision. Implementation must not begin until
`feat/checkout-redesign-zarinpal` merges, and must preserve every existing
transaction/lock boundary exactly, verified against the existing test
suites before and after.

No application code changes are made by this PR.
