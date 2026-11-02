# Admin Architecture — Current vs. Target

Status: this document **explicitly separates current architecture (as it
exists today) from the approved target architecture (ADR-002/ADR-003),
which is not yet implemented.** Do not read any "Target" section below as
already built.

## Current architecture

`apps/admin/app/` is nearly flat: `app/page.tsx`, `app/layout.tsx`,
`app/api/`, `app/backend/`, `app/reset-password/`. The entire staff
dashboard is effectively one route. `apps/admin/components/admin-dashboard.tsx`
is 2,623 lines with 39 `useState`/`useEffect` call sites — this is a
direct structural consequence of having one page-level entry point hosting
every domain view (orders, inventory, damage reports, reviews) as
component state, not evidence of careless growth in isolation.

`admin-dashboard.tsx` makes zero direct `fetch()` calls — it correctly
goes through the `lib/` API layer. The architectural problem is scope/
responsibility concentration caused by the routing structure, not a
layering violation.

`lib/` is small and focused: `admin-data.ts` (447 lines — pure types,
Persian display labels, derived UI-option functions; no network calls, no
state, no side effects), `admin-storage.ts` (24 lines — **only**
`localStorage` persistence of login-form preferences; despite its name,
unrelated to `apps/api/src/storage/`'s media storage, a real naming
collision risk), `api.ts`, `media-upload.ts` (+ spec), `proxy-api.ts`
(+ spec), `server-timing.ts` (+ spec), `storefront-url.ts`.

`admin-data.ts` duplicates `manualOrderTransitions` from the API's order-
transition logic (self-acknowledged in its own comment: "Mirrors
`MANUAL_ORDER_TRANSITIONS` in the API") — see ADR-006. It also contains a
hardcoded real name/email in a `seedMembers` fixture (L431-446) baked into
a `lib/` source file, not a test fixture — flagged for a Tech Lead
decision, not resolved by this PR.

**No test exists for `admin-data.ts`, `admin-storage.ts`, or
`admin-dashboard.tsx` itself.**

## Target architecture (approved: ADR-002, ADR-003 — not yet implemented)

- **Routing (ADR-002)**: independent Next.js routes per major domain
  (orders, inventory, damage reports, reviews), replacing the single flat
  route. Shared chrome (nav, auth gate) stays in a shared layout.
- **Organization (ADR-003)**: once routes exist, each domain is organized
  as a feature — colocated route segment, domain components, domain
  hooks, thin data-access layer — adapting (not cloning) the
  `lib/features/components` pattern already proven in `apps/storefront`.
  `admin-data.ts` and `admin-storage.ts` are **not** in scope for this
  reorganization; they are already correctly separated.

Implementation is explicitly **not part of this PR**. The first
implementation PR must extract one domain at a time, each preceded by
characterization tests per ADR-007, and must preserve every existing
admin URL or provide an explicit redirect.
