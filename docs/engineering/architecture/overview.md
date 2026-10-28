# RAD Monorepo Architecture — Overview

Status: **current architecture**, with approved target changes marked
explicitly. This document summarizes evidence gathered in the 2026-10
repository audit (Phases 01–03); see that audit's phase reports for full
detail and file-level citations. Where this document says "target," the
change is an **approved decision not yet implemented** — see the linked
ADR.

## Workspace layout (current)

```
RAD/                          npm workspaces: ["apps/storefront", "apps/api", "apps/admin", "packages/*"]
├── apps/storefront            Next.js 16 App Router — customer-facing, RTL/fa
├── apps/admin                 Next.js 16 App Router — staff dashboard
├── apps/api                   NestJS 11 + TypeORM — source of truth for business rules
├── apps/Rad-App                React Native — NOT an npm workspace member (see below)
├── packages/types              Shared enums/types — actively and correctly consumed
├── packages/ui                 Shared UI components
├── packages/state               Zustand wrapper — confirmed zero consumers (ADR-005)
├── packages/i18n                Shared i18n infrastructure
└── packages/artworks            Artwork utilities
```

## `apps/Rad-App` is intentionally isolated

`apps/Rad-App` (React Native) is **not** in the root `package.json`'s
`"workspaces"` array. It is installed separately
(`npm install --prefix apps/Rad-App`), has its own lockfile, its own test
runner (Jest — the only Jest usage in the repository; every other app uses
`node:test` via `tsx --test`), its own `README.md`/`ROADMAP.md`, and its
own CI-style guard: `scripts/check-isolation.mjs` builds its production
bundle and **fails if any module resolves from outside `apps/Rad-App`**
(not from `packages/*`, the other web apps, or root `node_modules`).

This is mature, deliberate architecture, not an oversight — but it was
previously **absent from `AGENTS.md`**, which could mislead an agent into
assuming `packages/*` is shared with it. This gap is corrected as part of
this PR's `AGENTS.md` update.

## Dependency direction

Apps depend on `packages/*`; no circular dependencies were found. No
production-code cross-import was found between API modules that should be
independent (e.g. `catalog` does not import `orders` internals). The one
cross-module coupling found is test-only: `inventory.spec.ts` imports
`orders/testing/purchase-harness` — acceptable, but means the two test
suites are not fully independent.

## CI (current, not changed by this PR)

`.github/workflows/ci.yml`: committed-`.env` guard → `lint` → `knip`
(scoped to `apps/storefront` only — a real coverage gap, see ADR-005) →
`format:changed:check` (Prettier on PR-changed files only, by deliberate
design, per the workflow's own comment, so formatting debt lands
gradually) → `typecheck:all` → tests. Separate deploy workflows exist per
app (Liara for storefront/admin, VPS for API) plus SSH/Tailscale/image
verification workflows.

## Target changes approved (not yet implemented)

- **ADR-002/003**: Admin moves from one flat route to independent routes
  per domain, with feature-based organization inside each.
- **ADR-004**: `orders.service.ts`'s gateway-payment methods move into a
  dedicated service within the `orders` module.
- **ADR-005**: `knip` (or equivalent) scope extends beyond storefront;
  `packages/state`'s disposition is a pending Tech Lead decision.
- **ADR-006**: `admin-data.ts`'s hand-duplicated order-transition and
  image-storage types move into `packages/types`.

None of these are implemented in this PR. See each ADR for sequencing and
prerequisites.
