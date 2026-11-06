<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Admin Engineering Rules

Hand-maintained content below the Next.js block. Never edit between the `BEGIN` and `END` markers. See [ADR-002](../../docs/engineering/adr/adr-002-admin-route-architecture.md), [ADR-003](../../docs/engineering/adr/adr-003-admin-feature-organization.md), [ADR-006](../../docs/engineering/adr/adr-006-shared-contract-ownership.md), [ADR-007](../../docs/engineering/adr/adr-007-test-first-refactoring.md), and [admin architecture](../../docs/engineering/architecture/admin.md). Root `AGENTS.md` §§7–9 and §13 still apply. When an audit note and the current source disagree, the current source wins.

## What exists now

- The staff UI is one client shell, `components/admin-shell.tsx`, mounted by `app/(studio)/layout.tsx`. `useAdminWorkspace()` runs once there. `/` still renders `components/admin-dashboard.tsx`. Customer reviews are the route `app/(studio)/reviews/page.tsx` (`/reviews`) and live in `features/reviews/`. Help questions are the route `app/(studio)/help/page.tsx` (`/help`) and live in `features/help/`. The other sections are still React state on `/`: overview, products, orders, messages, damage, commissions, shape, attributes, users, members, and account.
- Routes that exist today are `/`, `/reviews`, `/help`, `/reset-password`, `/api/health`, and the API proxy `/backend/[...path]`. Do not add another section route in a help change.
- The October audit's domain list (orders, inventory, damage, reviews) is incomplete, and there is no `inventory` section id. Read `AdminSection` before choosing the next migration.
- Sibling components (commissions, damage, messages, and others) and `hooks/use-admin-workspace.ts` stay mounted by the shell. Leave them in place until a route PR moves that one section.
- The only in-shell deep link is the `#commissions/<id>` hash read in `admin-dashboard.tsx`. Every other section still opens on overview. Preserve that hash, or replace it with a redirect the PR demonstrates.
- `app/layout.tsx` sets `<html lang="fa" dir="rtl">`. Keep Persian copy, RTL, and that document language and direction on every admin route.
- Login is `AdminLogin` inside the dashboard. Session restore and sign-in live in `use-admin-workspace.ts` (`/auth/me`, `/auth/session`). Do not add a second auth gate, and do not drop a valid session because one section request failed.
- `lib/admin-data.ts` still mirrors API order transitions and category labels. ADR-006 applies: the API is the authority for permissions, availability, order transitions, and payment review. A UI mirror must not become a second business rule. Leave `admin-data.ts` and `admin-storage.ts` where they are; `admin-storage.ts` is login-form `localStorage` preferences, not media storage.

## Approved target, one section at a time

ADR-002 and ADR-003 are accepted. Reviews (`/reviews`) and help questions (`/help`) are the sections migrated so far. Do not rewrite the dashboard in one PR, and do not create empty feature folders or speculative routes.

- Target shape: one App Router route per major section, with that section's components, hooks, and feature-local UI state under `features/<section>/`. Shared chrome (navigation, auth gate) stays in a shared layout. Adapt the storefront feature pattern; do not copy its i18n layer.
- Order of work: read the section's current behavior and the specs under `apps/admin/lib/`, add characterization for what those specs do not cover, then add that one route and move only that section. `admin-dashboard.tsx` itself has no characterization spec. The architecture note's "no admin tests" sentence is historical.
- Further splits inside the shell are not a substitute for a route. `app/page.tsx` is already a one-line entry; thinning it is not the migration. `/` must keep working as overview, or as an explicit redirect the PR states. Preserve `/reset-password` and `/backend/*`.
- Do not change Docker, Wrangler, or other deploy configuration in a route PR.

## Validation

- Use `rad-safe-refactor` for a behavior-preserving move. Run the repository's existing test scripts. Do not invent a test runner.
- Check mobile and desktop navigation, direct load and refresh, the commissions hash, session restore, `/reset-password`, keyboard use, dialogs, loading, error, and empty states, and overflow. Root `AGENTS.md` §7 is the checklist.
- Payment review, inventory, member permissions, and other admin writes need human approval before merge. Trace them through the API. Report checks that were not run.
