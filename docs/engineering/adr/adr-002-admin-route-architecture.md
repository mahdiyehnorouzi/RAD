# ADR-002: Use independent Next.js routes for major Admin domains

**Status:** Accepted

## Context

`apps/admin/app/` is nearly flat: `app/page.tsx`, `app/layout.tsx`,
`app/api/`, `app/backend/`, `app/reset-password/`. There is effectively one
customer-facing route for the entire staff dashboard. The 2026-10 audit
(Phase 02/03) found this is the direct structural cause of
`apps/admin/components/admin-dashboard.tsx` reaching 2,623 lines with 39
`useState`/`useEffect` call sites: every domain view (orders, inventory,
damage reports, reviews) lives as component state inside one file because
there is no route boundary pushing them out. No prior partial route-split
exists anywhere in the app to suggest an earlier decision either way.

## Approved Decision

Introduce independent Next.js App Router routes for each major Admin
domain (orders, inventory, damage reports, reviews, and any further domains
`admin-dashboard.tsx` currently hosts), replacing the single flat route.
Each domain route owns its own data fetching and local state; shared
chrome (nav, auth gate) stays in a shared layout.

This decision is the architectural **gate** for ADR-003 and for any future
decomposition of `admin-dashboard.tsx` — no component extraction from that
file should proceed until routes exist to extract *into*.

## Rationale

Route-level splitting gives real code-splitting, URL-addressable views, and
removes the single-entry-point pressure that produced the current file
size — a smaller, better-isolated set of client components without a route
change would still share one mount point and would likely regrow into a
similarly sized set of co-located files.

## Trade-offs

- Larger migration than extracting components in place: URLs, navigation,
  and possibly bookmarks/links change.
- Requires coordinating with deploy/CDN routing config for the Cloudflare
  Workers build (`@opennextjs/cloudflare`) — not yet verified whether
  existing routing config assumes a single page; must be checked before
  implementation.
- Keeping one route with better-isolated client components (the rejected
  alternative) is less disruptive short-term but does not resolve the root
  cause and was rejected for that reason.

## Consequences

- Any admin PR that touches dashboard structure must target this route
  architecture, not patch the existing flat route further.
- Existing admin URLs/bookmarks must be preserved or redirected;
  implementation PRs must state how.

## Implementation Constraints

- This ADR does not authorize any admin code changes in this PR. The first
  implementation PR must be scoped to **one** domain (per ADR-007's
  test-first rule) with characterization tests for that domain's current
  behavior written first.
- Do not split routes along guesses about domain boundaries — use the
  domain list already implied by `admin-dashboard.tsx`'s own state
  (orders, inventory, damage, reviews), confirmed by reading the file, not
  assumed from its imports.

## Verification Expectations

- Each extracted route must be manually verified against AGENTS.md §7's
  mobile-first checklist (mobile viewport, overflow, sticky elements,
  dialogs, loading/disabled/validation/error states) before merge.
- No admin URL should 404 post-migration; implementation PR must include a
  manual navigation check of every entry point into the old dashboard.
