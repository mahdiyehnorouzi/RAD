# Changelog

All notable product releases are tracked here. Version numbers follow [SemVer](https://semver.org/). Production deploys run from matching git tags (`vX.Y.Z`).

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
