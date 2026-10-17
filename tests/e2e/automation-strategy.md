# E2E automation strategy

## Infra assumption (important)

`playwright.config.ts`'s `webServer` only boots the two Next.js apps
(storefront on :3000, admin on :3002), using the exact commands from
AGENTS.md section 3. It does **not** attempt to start Postgres or the
NestJS API:

- Postgres needs `npm run db:up` (docker compose) — not something
  Playwright's `webServer` should own, since it's shared infra, slow to
  boot, and failure modes (docker not running, port conflicts) are better
  surfaced by the existing `npm run setup:api` flow than hidden inside a
  test runner.
- `apps/api` (`npm run dev:api`, port 4000) needs a live Postgres
  connection and a seeded `.env` before it will even start — Playwright
  has no way to know whether that's ready, and starting it blind risks
  silently testing against an empty/broken DB.

**Before running `npm run test:e2e`, start in order:**

```
npm run db:up
npm run dev:api     # separate terminal, waits for :4000
```

Playwright will then start storefront/admin itself (or reuse them if
already running — `reuseExistingServer: true`).

## Admin credentials

No admin seed user was found in `apps/api/seed/*.ts` during this task's
investigation. Tests that need to act as an admin (`tests/helpers/
admin-auth.ts`) require `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` env vars
pointing at a real admin account. This is deliberate — AGENTS.md says not
to invent business rules or fixtures, and hardcoding a guessed admin
credential would be exactly that.

## What's API-level vs UI-level, and why

Per AGENTS.md's "backend is the source of truth" principle, several specs
drive state through direct API calls (Playwright's `request` fixture)
rather than the UI, specifically where:

- the UI already blocks the request before it reaches the API (e.g.
  `payment-receipt.tsx`'s client-side guard for a missing receipt image or
  malformed tracking number), making a UI-level negative test incapable of
  reaching the real backend validation (`payment.spec.ts`);
- the actual form/wizard DOM wasn't located during this pass's time budget
  (`custom-orders/submission.spec.ts`, `messaging/customer-to-admin.spec.ts`)
  — rather than guess selectors, these cover the same business rule at the
  API boundary and flag the UI version as a follow-up;
- the task brief explicitly asked for API-driven admin actions in the
  cross-app scenario for speed (`cross-app/order-lifecycle.spec.ts`).

## Known gaps / follow-ups

- `storefront/product.spec.ts`'s sold-product case and `admin/orders.spec.ts`
  both depend on specific DB state (a sold product / a pending_verification
  order) existing at test time and `test.skip` themselves if that state
  isn't present — they are not proper seeded fixtures. A real fixture
  (seed script or API-driven setup) should replace this before relying on
  these in CI.
- The `/studio/start` custom-order wizard's and `/contact` page's exact DOM
  were not mapped — see the comments at the top of `submission.spec.ts` and
  `customer-to-admin.spec.ts`.
