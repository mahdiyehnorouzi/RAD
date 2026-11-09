# Admin Architecture — Current vs. Target

Status: this document separates the architecture that exists today from the
approved target (ADR-002/ADR-003). The target is only partly built:
customer reviews (`/reviews`), help questions (`/help`), messages
(`/messages`), and the shape questionnaire (`/shape`) are independent
routes. The other staff sections are still one dashboard.

## Current architecture

`apps/admin/app/(studio)/layout.tsx` mounts one client shell,
`components/admin-shell.tsx`. `useAdminWorkspace()` runs once there.
`app/(studio)/page.tsx` renders `components/admin-dashboard.tsx` at `/`.
`app/(studio)/reviews/page.tsx` renders `features/reviews/` at `/reviews`.
`app/(studio)/help/page.tsx` renders `features/help/` at `/help`.
`app/(studio)/messages/page.tsx` renders `features/messages/` at `/messages`.
`app/(studio)/shape/page.tsx` renders `features/shape/` at `/shape`.
`/reset-password`, `/api/health`, and `/backend/[...path]` stay outside
that studio split.

The sections still rendered from dashboard state are overview, products,
orders, damage, commissions, attributes, users, members, and
account. The only in-shell hash deep link is `#commissions/<id>`,
read when the shell first mounts.

`lib/admin-data.ts` is still the UI mirror for labels and derived options
(ADR-006: the API remains the authority for permissions, availability,
order transitions, and payment review). It still mirrors
`MANUAL_ORDER_TRANSITIONS` and still contains the `seedMembers` fixture
with a real name and email; that fixture is a Tech Lead decision and is
unchanged here. `lib/admin-storage.ts` is still only login-form
`localStorage` preferences. Neither file moves with a section route.

## Target architecture (approved: ADR-002, ADR-003 — remaining sections)

- **Routing (ADR-002)**: independent Next.js routes per major domain.
  Reviews, help questions, messages, and the shape questionnaire are done.
  Orders, damage, commissions, and the other dashboard sections above are
  not.
- **Organization (ADR-003)**: each migrated domain lives under
  `features/<section>/` and is mounted by a server `page.tsx` inside the
  shared studio layout. Shared chrome stays in `AdminShell`.
  `admin-data.ts` and `admin-storage.ts` are not part of this move.

The next migration is one remaining section, with characterization tests
first (ADR-007). `/` stays the overview dashboard. Existing URLs,
including `#commissions/<id>`, stay valid.
