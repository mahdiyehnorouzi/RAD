<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# RAD Engineering Agent

This section is maintained by engineers/agents (not auto-regenerated). It reflects what was actually found in this repository as of the 2026-10 audit — do not extend it with invented commands, paths, or tools.

## 1. Repository Structure

Monorepo using npm workspaces.

- **`apps/storefront`** — Next.js 16 (App Router) customer-facing site. Routes under `app/[locale]/...` (products, cart, checkout, orders, studio, making, account). Business logic in `lib/`, page-level composition in `features/`, UI in `components/`, copy in `i18n/`.
- **`apps/api`** — NestJS backend, the source of truth for all business rules. Organized by domain module under `src/`: `orders/`, `payment/`, `inventory/`, `cart/`, `catalog/`, `auth/`, `admin/`, `commissions/`, `database/` (TypeORM entities), `common/` (guards/middleware), `notices/`, `mail/`, `policies/`, `pricing/`, `damage/`, `reviews/`.
- **`apps/admin`** — Next.js 16 (App Router) staff dashboard. Order/payment review, damage reports, reviews, shape/help question management.
- **`packages/types`** — Shared TypeScript types/enums used across apps (e.g. `StoreOrderStatus`).
- **`packages/ui`** — Shared UI components.
- **`packages/state`** — Shared state utilities.
- **`packages/i18n`** — Shared i18n infrastructure (Persian/English).
- **`packages/artworks`** — Artwork-related utilities.

## 2. Tech Stack

Only what is actually installed:

- **Next.js `^16.3.2`** / **React `^19.2.6`** — storefront and admin, App Router.
- **NestJS `^11.1.6`** — API.
- **PostgreSQL + TypeORM `^1.1.1`** — database/ORM. Entities in `apps/api/src/database/entities/`.
- **Zustand `^5.0.15`** — client state management.
- **class-validator / class-transformer** — backend DTO validation.
- **@nestjs/jwt + bcryptjs** — authentication, cookie-based sessions (`common/session.middleware.ts`, `common/guards/`).
- **Testing: Node's built-in test runner (`node:test`) via `tsx --test`.** No Jest, Vitest, Playwright, or Cypress are installed anywhere in this repo.
- **Build/deploy**: Cloudflare Workers (`@opennextjs/cloudflare` / vinext) for storefront and admin; Render for the API. ESLint 9 + Prettier 3 for lint/format.

Do not assume any other framework, library, or test tool is available. If a task seems to require one that isn't listed here, flag it instead of adding it silently.

## 3. Commands

Use these exactly as found in root/`apps/*` `package.json`. Do not invent alternatives.

| Purpose | Command |
|---|---|
| Install | `npm install` (root) |
| Storefront dev | `npm run dev` (root) or `apps/storefront`: `next dev -H localhost -p 3000` |
| API dev | `npm run dev:api` (root), port 4000 |
| Admin dev | `npm run dev:admin` (root), port 3002 |
| Run all apps + DB | `npm run dev:all` |
| Build (all) | `npm run build:all` |
| Lint | `npm run lint` |
| Typecheck (all) | `npm run typecheck:all` |
| Tests (orders/purchase flow) | `npm run test:purchase` (in `apps/api`) |
| Tests (pricing) | `npm run test:pricing` (in `apps/api`) |
| Tests (all) | `npm run test` (root) |
| DB up | `npm run db:up` |
| DB down | `npm run db:down` |

## 4. Before Making Changes

Mandatory for every task, before editing anything:

1. Inspect the relevant existing implementation (read the actual files, don't assume).
2. Identify affected routes/pages/components.
3. Identify the API calls involved.
4. Identify the backend controller/DTO/service, if relevant.
5. Identify the database entities involved, if relevant.
6. Identify existing tests covering this area.
7. Determine whether the issue is frontend, backend, database, or spans multiple layers.

Do not patch the first visible symptom. Search the repository before introducing any new component, utility, API endpoint, validation helper, type, or business logic — avoid duplicate implementations of something that already exists.

## 5. RAD Business Rules

**Unique products**: RAD products are generally 1/1. The backend (`apps/api`) is the source of truth for availability — never the frontend. Disabled buttons or UI state alone do not prevent concurrent purchases. Do not weaken locking/reservation logic (`InventoryService`, `pessimistic_write` locks in `OrdersService.checkout`) without understanding the full purchase flow end to end.

**Cart**: Do not introduce quantity logic for 1/1 unique products unless the product model is explicitly changed to support it.

**Payment lifecycle** (as discovered in `apps/api/src/orders/orders.service.ts`):
- Checkout creates an `Order` (`status: "pending_payment"`), `OrderItem`s, and a `PaymentIntent` (`status: "created"`), and reserves inventory for `ORDER_PAYMENT_WINDOW_MS` (30 min).
- Customer submits a receipt image + optional tracking number via `confirm-payment`. `OrdersService.confirmPayment` validates the image, normalizes the tracking number, and moves `Order.status` → `"pending_verification"`, `PaymentIntent.status` → `"submitted"`.
- Admin reviews the receipt and approves or rejects. Approve → `Order.status: "confirmed"`, `PaymentIntent.status: "verified"`, `Product.status: "sold"`. Reject → `Order.status: "rejected"`, product restocked to `"available"`.
- Payment-related changes must be traced across the full chain: storefront UI → API client → DTO (`ConfirmPaymentDto`) → `OrdersService`/payment logic → `PaymentIntent`/`Order`/`Product` entities → admin review (`admin.service.ts`/`payment-review.service.ts`) → returned UI state. Do not change one link without checking the others.

**Tracking number**: `ConfirmPaymentDto` (`apps/api/src/orders/dto/confirm-payment.dto.ts`) applies only a DTO-level sanity bound (`MaxLength(40)`) — this is explicitly commented as not the real business rule. The actual rule (4-32 alphanumeric characters, after stripping spaces/dashes) lives solely in `normalizeTrackingNumber` (service-level, `payment-receipt.ts`). Treat these as two different layers: do not weaken the service-level rule just to make a frontend input pass, and make sure frontend validation mirrors the actual business constraint, not just the DTO sanity bound.

**Receipt submission**: `OrdersService.confirmPayment` already implements several protections — preserve all of them unless a task explicitly requires changing them, and never change them without updating/adding tests:
- Idempotent resubmission (identical hash + tracking number on an already-`submitted` payment is a no-op).
- Duplicate receipt/tracking detection across *other* orders (`assertReceiptNotReused`, SHA256 hash comparison).
- Submission cap (`MAX_RECEIPT_SUBMISSIONS = 5`).
- State validation before accepting a new receipt (`assertCanSubmitReceipt` — expired/rejected/cancelled/already-confirmed orders are rejected).
- Row-level locking (`pessimistic_write` on the `Order` row) for the whole transaction.

## 6. Error Handling

For user-facing flows:
- Never expose internal stack traces to the UI.
- Avoid surfacing raw technical validation messages when a clear Persian-language UX message already exists in the backend (errors are already returned with Persian `message` text and structured `code` fields, e.g. `receipt_required`, `receipt_invalid`, `tracking_invalid`, `order_expired`, `order_rejected`).
- Preserve these structured error codes — frontend code may already branch on them.
- Handle loading, success, validation error, API error, and retry states explicitly; do not swallow errors silently.

## 7. Frontend Rules

RAD is mobile-first. For any UI change, verify at minimum:
- Mobile viewport rendering
- Overflow behavior
- Fixed/sticky elements
- Dialogs/bottom sheets
- Loading state
- Disabled state
- Form validation state
- API error state

Do not perform unrelated visual redesigns while implementing an engineering fix.

## 8. Backend Rules

For backend changes:
- Preserve authentication and authorization (`AuthGuard`, `AdminGuard`, `session.middleware.ts`).
- Never trust client-provided ownership, availability, or pricing — always re-derive/re-check server-side (this is already the pattern in `OrdersService`, e.g. re-reading product prices and locking rows during checkout).
- Maintain existing transaction boundaries (`dataSource.transaction(...)` blocks in `OrdersService`).
- Preserve existing concurrency protections (pessimistic locks, hold/reservation logic in `InventoryService`).
- Do not remove backend validation to work around a frontend problem.
- Avoid database schema changes unless genuinely required by the task; any schema change must be explicitly justified in the task report.

## 9. Security-Sensitive Areas

Treat the following as high-risk and inspect authorization + state transitions explicitly before changing anything in them:
- Authentication
- Admin endpoints
- Order ownership
- Payment confirmation
- Receipt uploads
- Unique product reservation
- Product sold state
- File uploads
- Pricing
- Inventory

Never perform destructive testing against production.

## 10. Testing Rules

Use only the testing infrastructure that actually exists in this repository: API tests run via Node's built-in test runner through the existing repository scripts (`npm run test:purchase`, `npm run test:pricing`, `npm run test`). Do not assume Jest, Vitest, Playwright, or Cypress are available unless they are later genuinely added to the repo.

Before changing an existing test file, inspect its current git state first. Note: `apps/api/src/orders/purchase-flow.spec.ts` was already modified on the `feat/rad-conversational-copy` branch as of this audit — do not overwrite or discard existing uncommitted changes to this or any other file without checking first.

After implementation, run the smallest relevant checks first (e.g. a single spec file), then broader checks (typecheck/lint/full test run) where reasonable.

When reporting results, distinguish clearly between: **inspected**, **tested**, **manually verified**, and **not verified**. Never claim something works merely because the code looks correct.

## 11. Scope Discipline

Prefer the smallest safe change. Do not perform, unless necessary for the requested task:
- Unrelated refactors
- Broad renames
- Dependency upgrades
- Schema changes
- Formatting of unrelated files

If unrelated problems are discovered during a task, report them separately rather than fixing them silently.

## 12. Required Task Workflow

**Step 1 — Investigate**: Explain current behavior, root cause, affected layers, and relevant files.

**Step 2 — Plan**: State the minimal proposed change.

**Step 3 — Implement**: Modify only the required code.

**Step 4 — Validate**: Run relevant typecheck/lint/tests/build as appropriate to the change.

**Step 5 — Report**: Return Root cause, Files changed, Frontend impact, Backend impact, Database impact, Tests/checks executed, Remaining risks.

## 13. Safety Rule

If a task affects payment, inventory, authentication, authorization, unique-product availability, or database state, and the intended behavior is ambiguous, do not silently invent a business rule. Explain the ambiguity before making a destructive or irreversible change.
