# Changelog

All notable product releases are tracked here. Version numbers follow [SemVer](https://semver.org/). Production deploys run from matching git tags (`vX.Y.Z`).

## 1.5.0 - 2026-09-29

### Added

- Shape quiz questions and help-page questions served by the API (`/shape/questions`, `/help/questions`) and editable from admin.
- Admin review moderation, shared admin dialogs, and row actions.

### Changed

- The storefront shape quiz and help hub load their questions from the API, with loading and error states.

### Removed

- `apps/api/.env` is untracked again.

## 1.4.0 - 2026-09-29

### Added

- Shared artworks catalog (`@rad/artworks`) with inventory status, manual card payment, receipt review, and product QR labels.
- Help and policy pages, contact form, damage reports, product reviews, and a RAD story page.
- Stepped checkout with payment and receipt, a cart hold timer, and an illustrated shape quiz with result cards.
- Swagger docs, admin customers, FAQ API, Google Analytics 4, and storefront SEO metadata, sitemap, and robots rules.
- CI workflow (lint, typecheck, tests, production builds) that also gates tagged releases.

### Changed

- Redesign home, About, catalog, account, cart, orders, favorites, and policy pages with torn-paper editorial layouts.
- Migrate the API from Prisma to TypeORM; the API now deploys to its VPS separately from tagged releases.
- Credentialed CORS matches exact origins only (extra origins via `CORS_ORIGINS`).
- Production schema sync is opt-in through `TYPEORM_SYNCHRONIZE=true`; re-seeding never resets a work's status and skips demo orders in production.

### Removed

- `apps/api/.env` is no longer tracked.

## 1.3.0 - 2026-09-06

### Added

- Commission requests from the custom studio, with API persistence, artist decisions, and an admin review inbox.
- Shared `StageMeter` in `@rad/ui` for making, workshop, and admin commission stages.

### Changed

- Tighten making biography, catalog, product, and studio layout so commission progress reads as part of the record.

## 1.2.0 - 2026-09-02

### Changed

- Nest storefront UI by feature (parent folders, `type/`, `const/`, `hooks/`, `record/`) so ownership is readable.
- Split storefront lib into `lib/api/`, `lib/making/`, `lib/catalog/`, and `lib/difference/`.
- Add a Cursor skill and rule so storefront component structure stays consistent.

## 1.1.0 - 2026-09-02

### Added

- Making biography: customer workspace (`/making`), artist workshop (`/workshop`), quotes, approvals, and Record of Making.
- Difference Portrait in the custom studio, plus a public Museum of Differences (`/differences`).
- Tag-based release workflow that deploys storefront, admin, and API when a `v*` tag is pushed.

## 1.0.0 - 2026-08

### Added

- Initial bilingual storefront, admin, and Railway API deployment.
