# RAD Studio

RAD is a bilingual (Persian / English) ceramic studio platform: a customer storefront, an artist workshop, and an admin operations panel, backed by a NestJS API and PostgreSQL.

The repo is an **npm workspaces monorepo** (version `1.3.0`). Three apps run independently in development; shared code lives in `packages/`.

| App | Package | Default URL | Purpose |
| --- | --- | --- | --- |
| Storefront | `@rad/storefront` | http://localhost:3000 | Public shop, account, custom commissions, checkout |
| Admin | `@rad/admin` | http://localhost:3002 | Products, orders, commissions, customers, team access |
| API | `@rad/api` | http://localhost:4000 | REST backend, auth, Postgres via Prisma |

---

## Prerequisites

- **Node.js 22+** (used in production Docker images)
- **npm** (workspaces; install from repo root only)
- **Docker Desktop** (recommended) for local PostgreSQL

Optional for deployment:

- [Railway CLI](https://docs.railway.app/develop/cli) — API hosting
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) — Cloudflare Workers frontends
- `CLOUDFLARE_API_TOKEN` — storefront/admin Cloudflare deploys

---

## Quick start (full local stack)

From the repository root:

```bash
# 1. Install dependencies
npm install

# 2. Start Postgres and seed the database
npm run setup:api
```

`setup:api` runs `docker compose up`, then `prisma generate`, `prisma db push`, and `prisma db seed` inside `@rad/api`.

```bash
# 3. Configure the API (first time only)
cp apps/api/.env.example apps/api/.env
# Edit apps/api/.env — at minimum set ADMIN_PASSWORD and JWT_SECRET for local use
```

Start each service in its own terminal:

```bash
# Terminal 1 — API (NestJS, port 4000)
npm run dev:api

# Terminal 2 — Storefront (Next.js, port 3000)
npm run dev

# Terminal 3 — Admin panel (Next.js, port 3002)
npm run dev:admin
```

Open:

- Storefront: http://localhost:3000
- Admin: http://localhost:3002
- API health: http://localhost:4000/health
- Swagger UI: http://localhost:4000/docs

---

## How the apps connect

Browser requests from storefront and admin go to **`/backend/*`**, which is proxied to the Nest API:

- Storefront: `apps/storefront/app/backend/[...path]/route.ts`
- Admin: `apps/admin/app/backend/[...path]/route.ts`

Server-side rendering uses `API_URL` (defaults to `http://localhost:4000`). No extra frontend env is required for basic local development if the API runs on port 4000.

Authentication uses an HTTP-only cookie (`rad.auth`). CORS is enabled for localhost and configured production origins in `apps/api/src/main.ts`.

---

## Database

### Docker Postgres (recommended)

```bash
npm run db:up      # start postgres:16 on localhost:5432
npm run db:down    # stop container
```

Default credentials (from `docker-compose.yml`):

| Variable | Value |
| --- | --- |
| Host | `localhost:5432` |
| Database | `rad` |
| User | `rad` |
| Password | `rad` |

Connection string:

```text
postgresql://rad:rad@localhost:5432/rad?schema=public
```

### API database commands

Run from root via workspace:

```bash
npm run setup --workspace @rad/api          # generate + push + seed
npm run db:ensure-staff --workspace @rad/api  # upsert owner/editor only
```

Inside `apps/api`:

| Script | Description |
| --- | --- |
| `npm run setup` | `prisma generate`, `db push`, `db seed` |
| `npm run db:ensure-staff` | Create/update admin owner and editor accounts |
| `npm run db:embedded` | Start embedded Postgres (no Docker) |
| `npm run db:import-uploaded-products` | Import uploaded product data |

### Schema overview

Prisma schema: `apps/api/prisma/schema.prisma`

Main models: `User`, `Product`, `ProductImage`, `Vendor`, `CartItem`, `Favorite`, `Review`, `Order`, `PaymentIntent`, `Notice`, `Commission`.

Seed data loads catalog products, vendors, sample commerce data, and staff accounts (`apps/api/prisma/seed.ts`).

---

## Default accounts

Created by `ensure-staff` (runs on seed and production boot):

| Role | Email | Password |
| --- | --- | --- |
| Owner (admin) | Value of `ADMIN_EMAIL` in `apps/api/.env` (example: `mahdiyeh.norozi77@gmail.com`) | Value of `ADMIN_PASSWORD` (set in `.env`; fallback in code: `rad-studio-owner`) |
| Editor | `sahar@rad.studio` | `rad-editor-2026` |

**Storefront customers** register at http://localhost:3000/account (sign-up tab). They are stored as `User` rows with `role: "customer"` and appear in admin under **مشتریان** (Customers).

Only users with an `adminRole` can sign in to the admin panel.

---

## Environment variables

### `apps/api/.env`

Copy from `apps/api/.env.example`:

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for session JWT cookies |
| `PORT` | No | API port (default `4000`) |
| `STOREFRONT_ORIGIN` | Yes (prod) | CORS origin for storefront (local: `http://localhost:3000`) |
| `ADMIN_ORIGIN` | Yes (prod) | CORS origin for admin (local: `http://localhost:3002`) |
| `ADMIN_EMAIL` | No | Owner account email (seed / boot) |
| `ADMIN_PASSWORD` | No | Owner account password |
| `OPENAI_API_KEY` | No | AI design generation (`POST /design`) |
| `PAYMENT_MODE` | No | `manual_card` or `gateway` |
| `PAYMENT_CARD_*` | No | Bank card details for manual transfer checkout |
| `SMTP_*` | For password reset | Email delivery for forgot-password flow |
| `RUN_SEED` | Prod only | Set `true` to run full seed on deploy boot |

### `apps/storefront/.env` (optional locally)

| Variable | Description |
| --- | --- |
| `API_URL` | Upstream API for SSR and Cloudflare build (default `http://localhost:4000`) |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (production / SEO) |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 ID |
| `CLOUDFLARE_API_TOKEN` | Required for `deploy:cloudflare` |

### `apps/admin/.env` (optional locally)

| Variable | Description |
| --- | --- |
| `API_URL` | Upstream API (default `http://localhost:4000`) |

---

## NPM scripts (root)

| Script | Description |
| --- | --- |
| `npm run dev` | Storefront dev server (:3000) |
| `npm run dev:admin` | Admin dev server (:3002) |
| `npm run dev:api` | API watch mode (:4000) |
| `npm run setup:api` | Docker Postgres + DB migrate + seed |
| `npm run db:up` / `db:down` | Start/stop Postgres container |
| `npm run build` | Build storefront |
| `npm run build:admin` | Build admin |
| `npm run build:all` | Build all workspaces |
| `npm run typecheck:all` | Typecheck all workspaces |
| `npm run deploy:release` | Deploy API + storefront + admin (CI/release) |
| `npm run deploy:api` | Deploy API to Railway |
| `npm run deploy:storefront` | Deploy storefront to Cloudflare |
| `npm run deploy:admin` | Deploy admin to Cloudflare |

---

## API reference

### Swagger

Interactive docs with sample request bodies:

- UI: http://localhost:4000/docs
- OpenAPI JSON: http://localhost:4000/docs-json

Sign in via `POST /auth/session` first; the `rad.auth` cookie is sent automatically in Try it out.

### Main route groups

| Prefix | Description |
| --- | --- |
| `/health` | Service health check |
| `/auth` | Register, login, logout, password reset |
| `/products`, `/search`, `/catalog/images` | Public catalog |
| `/cart`, `/favorites` | Guest and user commerce state |
| `/orders` | Checkout and payment |
| `/products/:slug/reviews` | Product reviews |
| `/notices` | In-app notifications |
| `/commissions` | Custom making / workshop flow |
| `/design` | AI concept generation |
| `/content/faq` | Product page shipping FAQ (`?locale=fa\|en`) |
| `/admin/*` | Admin-only CRUD (requires admin session) |

Admin permissions (`owner`, `manager`, `editor`, `viewer`) are enforced server-side in `apps/api/src/admin/permissions.ts`.

---

## Applications in detail

### Storefront (`apps/storefront`)

Next.js 16 customer app. Bilingual UI (fa/en), PWA service worker, catalog, cart, checkout, account, favorites, custom commissions (“making”), and artist workshop views.

Notable routes:

| Path | Description |
| --- | --- |
| `/` | Home |
| `/products`, `/products/[slug]` | Catalog |
| `/cart`, `/checkout` | Commerce |
| `/account` | Login / register |
| `/orders` | Order history |
| `/making`, `/making/[id]` | Customer commission tracking |
| `/workshop` | Artist-side commission board |
| `/studio` | Custom design request |

Dev: `npm run dev` (port **3000**).

Cloudflare: `npm run build:vinext` / `npm run deploy:cloudflare` inside the workspace.

### Admin (`apps/admin`)

Next.js operations panel (Persian UI): products, store orders, custom commissions, storefront customers, team members, account settings.

Dev: `npm run dev:admin` (port **3002**).

### API (`apps/api`)

NestJS 11 + Prisma 6 + PostgreSQL.

Dev: `npm run dev:api` — runs `nest start --watch` (builds first if `dist/` is missing).

Production entry: `npm run start:production` → migrates schema, ensures staff, optional seed, then starts `dist/main.js`.

Build: `npm run build --workspace @rad/api`

---

## Shared packages

| Package | Path | Used by |
| --- | --- | --- |
| `@rad/types` | `packages/types` | Shared TypeScript contracts (Product, Order, AuthUser, …) |
| `@rad/ui` | `packages/ui` | Shared React UI (e.g. stage meter) |
| `@rad/state` | `packages/state` | Zustand client stores |
| `@rad/i18n` | `packages/i18n` | Shared locale strings |

Import from apps via workspace names, e.g. `import type { Product } from "@rad/types"`.

---

## Project structure

```text
RAD/
├── apps/
│   ├── api/              # NestJS backend, Prisma, Swagger
│   ├── admin/            # Next.js admin panel
│   └── storefront/       # Next.js customer storefront
├── packages/
│   ├── types/
│   ├── ui/
│   ├── state/
│   └── i18n/
├── scripts/              # Deploy and release scripts
├── docker-compose.yml    # Local PostgreSQL
├── Dockerfile.api        # Production API image
├── render.yaml           # Render.com blueprint (API + Postgres)
├── ARCHITECTURE.md       # High-level design notes
└── VERSION               # Monorepo version (1.3.0)
```

---

## Deployment

Production layout:

- **API** — Railway or Render (`Dockerfile.api`, health check `/health`)
- **Storefront** — Cloudflare Workers (`vinext` build)
- **Admin** — Cloudflare Workers

Full release (from root, with Railway/Cloudflare credentials configured):

```bash
npm run deploy:release
```

Individual deploys:

```bash
npm run deploy:api
npm run deploy:storefront
npm run deploy:admin
```

On API boot in production (`scripts/start-production.mjs`):

1. `prisma db push`
2. `ensure-staff` (owner/editor accounts)
3. Full seed if `RUN_SEED=true`
4. Start HTTP server

Set `STOREFRONT_ORIGIN`, `ADMIN_ORIGIN`, `JWT_SECRET`, `DATABASE_URL`, and SMTP vars in the hosting dashboard. Point storefront/admin `API_URL` at the deployed API URL.

---

## Development tips

### Typecheck

```bash
npm run typecheck:all
```

Or per workspace:

```bash
npm run typecheck --workspace @rad/storefront
npm run typecheck --workspace @rad/admin
npm run typecheck --workspace @rad/api
```

### Reset local database

```bash
npm run db:down
docker volume rm rad_postgres   # optional: wipe data
npm run setup:api
```

### API unavailable in browser

If storefront/admin show API errors, confirm:

1. API is running on port 4000
2. Postgres is up (`npm run db:up`)
3. `apps/api/.env` has a valid `DATABASE_URL`

### Password recovery

Requires SMTP settings in `apps/api/.env`. Without SMTP, registration and login still work; forgot-password emails will not send.

### Payments

Default mode is `PAYMENT_MODE=manual_card`: checkout returns bank transfer instructions and accepts a receipt image. Switch to `gateway` when a payment provider adapter is wired.

---

## Security notes

- Passwords are hashed with bcrypt; sessions use HTTP-only cookies, not localStorage.
- Admin actions are authorized by `adminRole` on the server, not by UI alone.
- Product images in admin requests can be large; JSON body limit is **12 MB**.
- Rate limiting: global 120 req/min; stricter limits on auth routes.
- Do not commit `.env` files or secrets. Use strong `JWT_SECRET` and `ADMIN_PASSWORD` in production.

---

## License

Private project — all rights reserved unless otherwise specified.
