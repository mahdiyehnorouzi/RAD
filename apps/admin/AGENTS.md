<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Admin Engineering Rules

Hand-maintained content below the Next.js-generated block. See [ADR-002](../../docs/engineering/adr/adr-002-admin-route-architecture.md) and [ADR-003](../../docs/engineering/adr/adr-003-admin-feature-organization.md).

## Current vs. approved target

- **Current:** the staff dashboard is largely served from `app/page.tsx` and `components/admin-dashboard.tsx`. Do not imply domain routes already exist.
- **Approved target:** each major domain has a distinct Next.js App Router route; domain components, hooks, UI state, and feature-local logic live together in `features/<domain>/`. Shared layout, navigation, and truly reusable UI stay outside features.
- Do not invent routes or create speculative feature folders. Inspect actual dashboard sections, navigation, auth behavior, and deep links before choosing one domain for migration.
- Preserve existing entry URLs/bookmarks (or provide verified redirects), session/auth behavior, access controls, Persian UX copy, forms, modal state, upload behavior, and error states.

## Implementation boundaries

- Keep `page.tsx` as a thin route entry and use a shared dashboard layout where appropriate.
- Treat API as the sole authority for permission checks, product availability, order transitions, and payment review. Shared pure contracts follow ADR-006; UI mirrors must not become independent business rules.
- Do not import another feature's private files directly. Prefer a narrow public interface or move genuinely shared code to a justified shared location.
- Avoid opportunistic extraction from `admin-dashboard.tsx`. Before moving any domain, identify its state ownership, effects, dependencies, and behavior, and build characterization tests according to ADR-007.

## Validation and approvals

- Validate mobile and desktop navigation, direct URL refresh, auth redirects, keyboard interaction, dialogs/bottom sheets, loading/error/empty states, and no unintended layout overflow.
- Trace payment approvals, inventory, and admin write actions end-to-end. Require human approval before merging security-sensitive PRs.
- Keep the regenerated Next.js block above unchanged. Use existing scripts and test infrastructure; report tests not run or UX not verified without claiming success.
