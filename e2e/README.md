# Local browser E2E — purchase & payment flow (RAD-134)

Browser-driven Playwright tests for the purchase flow (PDP → cart →
checkout → payment → result), covering the scenarios in RAD-108/RAD-134.
Everything this suite touches is local and disposable; see "Safety" below.

## Run it

```bash
npm run test:e2e
```

First run only, to install Playwright's browser-launcher deps (not the
browser binary itself — see "Browser" below):

```bash
npx playwright install-deps chromium
```

## What happens

`global-setup.ts` runs once before any spec, inside the same long-lived
process Playwright keeps alive for the whole run, and returns a teardown
function Playwright calls after the last test:

1. A disposable embedded Postgres (`embedded-postgres`), random port, temp
   data dir, deleted on teardown.
2. The fixture products in `support/fixture.ts` are seeded into it as a
   separate `tsx` process (`support/seed-e2e-db-cli.ts`), reusing the same
   `seedArtists`/`seedArtworks` code production seeding uses.
3. A local mock ZarinPal gateway (`support/mock-zarinpal.ts`) — a plain
   `node:http` server implementing just enough of `request.json`,
   `verify.json` and the `StartPay` redirect page for the real
   gateway-payment UI to drive unmodified.
4. The real API (`apps/api`: `npm run build` + `node dist/main.js`),
   pointed at the disposable DB and the mock gateway via env vars only —
   `PAYMENT_MODE=gateway`, `ZARINPAL_BASE_URL=<mock gateway>`,
   `STOREFRONT_ORIGIN=<this run's storefront>`.
5. The real storefront (`apps/storefront`: `next dev`), pointed at that
   API via `API_URL`.

Each spec talks to these over `support/flows.ts` helpers and
`support/state.ts` (the ports/URLs `global-setup.ts` wrote to
`.runtime/state.json`).

## Browser

Playwright's own Chromium download (`npx playwright install chromium`) is
geo-blocked from this environment (`cdn.playwright.dev` returns 403 "not
available in your location"). `playwright.config.ts` instead uses
`channel: "chrome"`, driving the machine's already-installed Google
Chrome. If Chrome isn't installed, install it or switch the config to a
different installed channel/browser.

## Safety

- **Fails closed before starting anything** (`global-setup.ts`'s
  `failClosedPreflightCheck`): refuses to run if `NODE_ENV=production`,
  if a real `ZARINPAL_MERCHANT_ID` is already set in the ambient
  environment, or if `DATABASE_URL` is already set (this harness always
  generates its own).
- The Postgres instance is `persistent: false`, random port, temp dir —
  never the repo's dev Postgres (`docker-compose.yml`, port 5432).
- `ZARINPAL_BASE_URL` (`apps/api/src/payment/zarinpal.adapter.ts`) is
  refused outright when `NODE_ENV=production`, and refused for anything
  but a loopback host — a copied/exported env var can't redirect real
  payment traffic.
- The mock gateway never talks to any real ZarinPal host (sandbox or
  live); it's a from-scratch `node:http` server on a random loopback
  port.
- Nothing here merges, deploys, or touches any non-local database.

## Fixture products

1/1 inventory is exactly that — once a spec buys or holds one, it's gone
for the rest of the run. `fixture.ts` assigns each spec its OWN slug from
`@rad/artworks`'s real catalog (not synthetic rows) so specs never
contend with each other for the same unit. Add a new entry there (picking
another `initialStatus: "available"`, priced record) before adding a spec
that needs its own fresh item.

## Known gaps / open questions

- **A gateway outage at `checkout()`-creation time** (as opposed to at
  verify time, which scenario 7 covers) is a different, open question:
  `orders.service.ts`'s `checkout()` commits the order, clears the cart,
  and reserves inventory in one transaction *before* calling the
  gateway — a failure there leaves a real `pending_payment` order the
  buyer was never told the id of, with an emptied cart they can't use to
  retry from. This looks like a gap in the product, not something to
  route around with an invented retry path in a test. See the comment in
  `specs/07-gateway-error-then-retry.spec.ts`.
- The `request_down_once` outcome in `support/mock-zarinpal.ts` is built
  but not exercised by any passing spec, for the reason above.
