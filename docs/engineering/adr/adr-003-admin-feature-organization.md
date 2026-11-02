# ADR-003: Use feature-based organization for Admin implementation

**Status:** Accepted

## Context

Within `apps/admin`, non-dashboard code is already organized cleanly:
`lib/admin-data.ts` (types, Persian display labels, derived UI-option
functions — confirmed by direct read, Phase 03) and `lib/admin-storage.ts`
(24 lines, login-form `localStorage` preferences only) are both small and
single-purpose. The audit found no competing organizational pattern
elsewhere in the app. The boundary problem the audit identified is entirely
*inside* `admin-dashboard.tsx`, not in how `lib/` is organized.

This ADR depends on ADR-002: extracting components before routes exist
risks extracting along the wrong seams (e.g. splitting by UI widget rather
than by the domain a route will own).

## Approved Decision

Once ADR-002's routes exist, organize each domain's implementation as a
feature: colocated `page.tsx` (or route segment), domain components,
domain-specific hooks, and a thin data-access layer, mirroring the
`lib/features/components` split already proven in `apps/storefront`
(adapted to Admin's simpler needs — Admin does not need storefront's
`i18n`/RTL layer duplicated).

`admin-data.ts` and `admin-storage.ts` are **not** in scope for this
reorganization — they are already correctly separated and should not be
moved or split "for consistency" alone.

## Rationale

Reusing a pattern that already works in this monorepo (storefront's split)
is lower-risk than inventing a new one, and keeps conventions recognizable
across apps without forcing identical structure where the apps' needs
differ (per the audit's explicit instruction not to impose one common
structure across all three apps).

## Trade-offs

- Admin's simpler domain model doesn't need every storefront convention
  (e.g. no RTL-specific layer); copying the pattern wholesale would add
  unused structure. Implementation PRs should adapt, not clone.
- This decision cannot be implemented independently of ADR-002's timeline.

## Consequences

- The eventual `admin-dashboard.tsx` decomposition PRs (see ADR-004-style
  incremental extraction, applied to Admin) will each move one domain's
  state and markup into its new route's feature folder.
- `apps/admin/AGENTS.md` (appended section) should state this target
  layout once ADR-002 implementation begins, not before — stating it
  prematurely risks documenting a structure that doesn't exist yet,
  which `AGENTS.md`'s own existing rule explicitly warns against
  ("do not extend it with invented commands, paths, or tools").

## Implementation Constraints

- No file moves in this PR.
- The first domain extracted should be the one with the clearest existing
  test coverage boundary, to satisfy ADR-007 before the others.

## Verification Expectations

- Each extracted feature folder should be reviewable as a standalone diff
  (one domain per PR), per the audit's scope-discipline finding.
