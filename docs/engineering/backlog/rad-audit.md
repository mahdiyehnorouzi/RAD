# RAD audit

Audit date: 31 October 2026. Audit only. No application code, production data, migrations, deploys, or merges were changed.

## Source of truth

The authoritative backlog is `docs/RAD_Complete_Task_Backlog.xlsx` (sheet `Backlog`).

| Check | Result |
|---|---|
| Rows | 111 |
| IDs | RAD-001 through RAD-111 |
| Duplicates | none |
| Gaps in that range | none |
| Sheet priorities | P0 20, P1 71, P2 20 |
| Sheet status | «انجام‌نشده» on every row |

That status column is the requester’s starting mark. It is not a code finding. The audit status is in `rad-task-status.md`.

`docs/recovery/2026-10-25-status.md` is supporting evidence for an older 25-issue list. It is mapped onto the 111 in the status doc. A closed recovery issue does not close a UX or product task in the spreadsheet.

The workbook’s Overview sheet says the rows were proposed from a user list and had not been audited against the code. This document is that audit.

## Baseline

| | |
|---|---|
| Shipped code | `origin/main` at `d0d28e1` (merge of PR #127) |
| This checkout | `fix/admin-mobile-commission-date-drawer-height` at `944e086`, behind main, clean when checked |
| GitHub issues | none |
| Tests re-run in this audit | no |
| Browser | not opened |

`git fetch origin main` during this correction returned the same `d0d28e1` already on the remote-tracking branch.

## Design references

The sheet names these labels and embeds no pictures. No files for them were found under `docs/`.

| Label | Tasks that cite it |
|---|---|
| تصویر ۲: Login | RAD-004 |
| تصویر ۵: Admin login | RAD-005 |
| تصویر ۵: Admin | RAD-023 |
| تصویر ۴: Navbar Mobile | RAD-019 |
| تصویر ۴: Navbar Desktop | RAD-020 |
| تصویر ۴: Footer Mobile | RAD-021 |
| تصویر ۴: Footer Desktop | RAD-022 |
| تصویر ۳: Custom Order | RAD-066, RAD-067, RAD-068 |
| تصویر ۱: Order management | RAD-073 |

RAD-111 asks for a final comparison against the references. Visual comparison is blocked until the images are added to the repo. No layout, color, or spacing was inferred from them.

## What the code already is

Storefront and admin are Next.js 16 App Router. The API is NestJS and TypeORM on PostgreSQL. Persian is the default locale. `PAYMENT_MODE` defaults to manual card. Cart hold is 15 minutes. Payment window is 30 minutes. A hold is `sold` plus `holdExpiresAt`; `effectiveProductStatus()` in `packages/types` is the display rule.

Auth on main is email and password, plus forgot and reset (`apps/api/src/auth/auth.controller.ts`, `account-login.tsx`). OTP and Google are not on main. Draft PRs #106–#108 are open.

`ProductCategory` is a flat union. `User` has no phone and no addresses. Checkout cities are one flat list in `lib/geo/iran-cities.ts`. Phone digits are normalized to Latin on the client and in `payment-receipt.ts`, with a purchase test for Persian digits (RAD-054).

Admin sections do not include artist applications. That gap is real and is **not** one of the 111 IDs. It stays in the recovery map so it is not forgotten.

## Business codes found while reading RAD-011

| Code | Where it is created | Uniqueness |
|---|---|---|
| `Product.radNumber` | `createProductWithRadNumber`, retry on conflict | unique column, race spec |
| `Product.slug` | admin save, immutable after create | unique column, conflict if changed |
| Order id | database id | primary key, not a separate display sequence |
| `PaymentIntent` authority | gateway | unique column |
| Commission id | commission create | primary key; writes are row-locked |
| Passport code | derived from the work / RAD number in `lib/passport` | not a second sequence |
| Cart row | owner + product slug | unique pair |

This table is not a sign-off of RAD-011. Message templates and QR labels were not all opened.

## Counts

Done 1 · Partial 32 · Missing 20 · Needs Verification 58.

The single Done task is RAD-054 (Persian and Arabic phone digits). Needs Verification is large because most of the backlog is visual, copy, or device behavior, and this audit did not render the site. The reference images are absent.

## Coverage

`rad-task-status.md` has a coverage table and a section for every ID. `rad-execution-plan.md` names every ID on a PR. Union of those PRs is RAD-001 through RAD-111.
