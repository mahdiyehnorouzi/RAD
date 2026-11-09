# RAD execution plan

Source: `docs/RAD_Complete_Task_Backlog.xlsx`, 111 tasks. Branch every PR from `origin/main` (`d0d28e1` or later), not from the checkout that is behind it.

The PR id on each task in `rad-task-status.md` is the group below. A few groups are split into smaller reviews so unrelated screens do not land together. The task ID stays on that group.

Sheet dependencies that point at the wrong ID are listed in the status doc. They are not treated as blockers.

## Order

| Order | PR | IDs | Decision required |
|---|---|---|---|
| 1 | PR-1 Not-yet payment | RAD-064 | Yes. Approve the rule below or replace it |
| 2 | PR-2 Provinces, cities, phone format | RAD-052, RAD-053, RAD-054, RAD-055 | City dataset only. RAD-054 is already done |
| 3 | PR-3 Card copy check | RAD-063 | No, unless a phone fails the existing control |
| 4 | PR-4 Bag count and buy button | RAD-059, RAD-039, RAD-045 | No |
| 5 | PR-5 Profile and addresses | RAD-014, RAD-015, RAD-016, RAD-017, RAD-018, RAD-086 | Consent behavior for RAD-018 |
| 6 | PR-6 Note to RAD | RAD-060 | Optional vs required note |
| 7 | PR-7 Auth | RAD-001, RAD-002, RAD-003, RAD-004, RAD-005 | OTP and Google credentials. Login images missing |
| 8 | PR-8 Categories | RAD-006, RAD-007, RAD-008, RAD-009 | The category tree |
| 9 | PR-9 Codes | RAD-011, RAD-012, RAD-013 | Which codes must be human-facing |
| 10 | PR-10 Explicit small UI changes | RAD-026, RAD-046, RAD-083, RAD-089, RAD-100, RAD-102, RAD-103 | Split as 10a–10e below |
| 11 | PR-11 PDP content | RAD-027–RAD-038 | RAD-030 before RAD-031 |
| 12 | PR-12 Gallery | RAD-040–RAD-044, RAD-047 | No, after a failing recording |
| 13 | PR-13 Cart copy | RAD-048, RAD-049, RAD-050 | No |
| 14 | PR-14 Checkout chrome | RAD-051, RAD-056–RAD-058, RAD-061, RAD-062, RAD-065 | No |
| 15 | PR-15 Custom order | RAD-066–RAD-072 | Images for RAD-066–068 |
| 16 | PR-16 Orders and making | RAD-073–RAD-082, RAD-084, RAD-085 | RAD-073 IA first |
| 17 | PR-17 Content pages | RAD-087–RAD-098 except RAD-089 (in PR-10) | RAD-087 keep-or-merge |
| 18 | PR-18 Shape and other pages | RAD-099, RAD-101, RAD-104–RAD-107 | RAD-030 before RAD-104 |
| 19 | PR-19 Nav, footer, icons, admin PWA | RAD-019–RAD-025 | Reference images |
| 20 | PR-20 Story flow | RAD-010 | What a story step contains |
| 21 | PR-21 Release checks | RAD-108, RAD-109, RAD-110, RAD-111 | Runs across the other PRs, not as one dump |

IDs in this table: 111. RAD-054 is listed on PR-2 so the coverage is complete; it does not need new code unless a regression appears.

## PR-1 — Predictable «هنوز نه»

**Recommended first implementation PR**, after the rule below is accepted.

- **IDs:** RAD-064
- **Scope:** The control in `checkout-payment.tsx` that links to `/cart`. Checkout has already created the order and cleared the bag, so the buyer can land on an empty cart while the work stays reserved.
- **Proposed rule (needs approval):** «هنوز نه» returns to that unpaid order’s payment step. It does not cancel the order, does not restock, and does not pretend the cart still holds the work. The page says the work is reserved on the order until the payment window ends.
- **Dependencies:** none in the sheet.
- **Acceptance:** deferral does not show an empty cart as if the purchase vanished. Order status and hold stay what they were. A real cancel still uses the existing cancel action.
- **Tests:** storefront unit test for the href or action. Staging: place a test order, press «هنوز نه», confirm the order is still `pending_payment` and the product is still held. No production order.
- **Risk:** high. This sits next to cart clearing and inventory holds. Do not release the hold from the client.
- **Out of scope:** card copy, provinces, profile, OTP.

## PR-2 — Province, city, phone format

- **IDs:** RAD-052, RAD-053, RAD-055. RAD-054 stays as the existing digit normalizer.
- **Scope:** a maintainable list of Iran’s provinces; cities filtered by province; changing province clears the city. Phone field formats as the user types, validates on the client and server, and shows the error after interaction.
- **Dependencies:** ignore the sheet link from RAD-053 to RAD-051 and from RAD-055 to RAD-053.
- **Decision:** which city list (all official cities vs capitals plus major cities). Provinces themselves are specified.
- **Files:** `lib/geo/iran-cities.ts`, `city-select.tsx`, `checkout-page.tsx`, checkout copy, API `normalizePhone` if the live rule is stricter than length 10–15. Collaboration (RAD-097) waits until this list exists, then reuses it.
- **Tests:** unit tests for filter and clear, Persian and Arabic digits, too-short numbers. No migration.
- **Risk:** medium. Do not weaken server phone checks.

## PR-3 — Card number copy

- **IDs:** RAD-063
- **Scope:** confirm `payment-card.tsx` success and failure on iOS Safari and Android Chrome. Change code only if that check fails.
- **Risk:** low if the check passes. Medium if clipboard permissions need a fallback.
- **Decision:** no.

## PR-4 — Counts and buy button

- **IDs:** RAD-059, RAD-039, RAD-045
- **Scope:** one count and one money figure from cart through checkout success. Floating buy and cart use the same available / reserved / sold / loading / in-bag rules. In-bag color and icon order get a defined treatment.
- **Risk:** medium. Do not fork a second inventory rule.
- **Decision:** no.

## PR-5 — Profile and addresses

- **IDs:** RAD-014, RAD-015, RAD-016, RAD-017, RAD-018, RAD-086
- **Scope:** family name, email, phone, many addresses, one default, owner-only access. Profile form. Password change for password accounts. Checkout can save into the profile only with an explicit choice. The order keeps its own address snapshot.
- **Database:** new columns or an `Address` table. Migration and rollback notes required (feeds RAD-110).
- **Decision:** what «با رضایت» means on RAD-018 (checkbox vs save-by-default). The field list itself is already in the acceptance text.
- **Risk:** high. Session user only. Never trust a client user id.

## PR-6 — Message on the order

- **IDs:** RAD-060
- **Scope:** optional note stored on the order and visible in admin with the order, plus the existing staff attention pattern. Not a new public inbox.
- **Decision:** max length and whether the note is required.
- **Risk:** medium. Do not mix it into payment verification.

## PR-7 — Auth

- **IDs:** RAD-001, RAD-002, RAD-003, RAD-004, RAD-005
- **Scope:** review drafts #106 → #107 → #108 instead of a fourth OTP implementation. Finish password-session gaps from RAD-003. Redesigns wait on the login images.
- **Decision:** SMS provider credentials and Google OAuth client. Both are blockers for a production ship, not for reading the drafts.
- **Risk:** high. Admin login and password reset must keep working.

## PR-8 — Categories

- **IDs:** RAD-006, RAD-007, RAD-008, RAD-009
- **Scope:** parent/child with stable ids, safe migration for current products, admin CRUD, storefront filters.
- **Decision:** the actual tree, including vases and tableware. Blocked until that list exists.
- **Risk:** high. PLP URLs and admin category values.

## PR-9 — Unique codes

- **IDs:** RAD-011, RAD-012, RAD-013
- **Scope:** finish the inventory, then add constraints and race tests only for codes the inventory says are missing. Display the same value on PDP, passport, orders, and admin.
- **Decision:** which codes are customer-visible.
- **Risk:** high if a new unique index is applied to dirty data. Dry-run the index on a copy of the schema first.

## PR-10 — Small explicit edits

Ship as separate reviews:

| Sub | IDs | Scope |
|---|---|---|
| 10a | RAD-026 | Remove the home `RadBanner` mount. No leftover gap |
| 10b | RAD-046 | Remove the floating-buy divider and fix spacing |
| 10c | RAD-083 | Remove track-card, track-address, order-next, and order-help as the task states |
| 10d | RAD-089 | Replace «گفت‌وگو با مهدیه»; keep the contact link |
| 10e | RAD-100, RAD-102, RAD-103 | Shape result: custom-order CTA, persist answers, all cards go to the PDP |

Risk: low to medium. 10e changes navigation. 10c removes recovery actions; read the order page before deleting help.

## Later groups

PR-11 through PR-21 stay as in the table. Do not start a visual PR in PR-12, PR-15, PR-16, or PR-19 until either a browser recording shows the bug or the reference image is in the repo. RAD-030 is a written recommendation, not a silent redesign. RAD-073 is an IA note before making and order cards are redrawn. RAD-087 is a keep-or-merge decision before help copy (RAD-088).

PR-21 is the regression net: API purchase tests on every payment PR, and a staging script from the test matrix. It is not one pull request that “adds e2e” with a new framework unless the repo adopts one. Today the runner is Node’s test runner.

## ID index

Every spreadsheet ID and the PR group above. Ranges in the narrative are expanded here so none are omitted.

| ID | PR | ID | PR | ID | PR |
|---|---|---|---|---|---|
| RAD-001 | PR-7 | RAD-038 | PR-11 | RAD-075 | PR-16 |
| RAD-002 | PR-7 | RAD-039 | PR-4 | RAD-076 | PR-16 |
| RAD-003 | PR-7 | RAD-040 | PR-12 | RAD-077 | PR-16 |
| RAD-004 | PR-7 | RAD-041 | PR-12 | RAD-078 | PR-16 |
| RAD-005 | PR-7 | RAD-042 | PR-12 | RAD-079 | PR-16 |
| RAD-006 | PR-8 | RAD-043 | PR-12 | RAD-080 | PR-16 |
| RAD-007 | PR-8 | RAD-044 | PR-12 | RAD-081 | PR-16 |
| RAD-008 | PR-8 | RAD-045 | PR-4 | RAD-082 | PR-16 |
| RAD-009 | PR-8 | RAD-046 | PR-10 | RAD-083 | PR-10 |
| RAD-010 | PR-20 | RAD-047 | PR-12 | RAD-084 | PR-16 |
| RAD-011 | PR-9 | RAD-048 | PR-13 | RAD-085 | PR-16 |
| RAD-012 | PR-9 | RAD-049 | PR-13 | RAD-086 | PR-5 |
| RAD-013 | PR-9 | RAD-050 | PR-13 | RAD-087 | PR-17 |
| RAD-014 | PR-5 | RAD-051 | PR-14 | RAD-088 | PR-17 |
| RAD-015 | PR-5 | RAD-052 | PR-2 | RAD-089 | PR-10 |
| RAD-016 | PR-5 | RAD-053 | PR-2 | RAD-090 | PR-17 |
| RAD-017 | PR-5 | RAD-054 | PR-2 | RAD-091 | PR-17 |
| RAD-018 | PR-5 | RAD-055 | PR-2 | RAD-092 | PR-17 |
| RAD-019 | PR-19 | RAD-056 | PR-14 | RAD-093 | PR-17 |
| RAD-020 | PR-19 | RAD-057 | PR-14 | RAD-094 | PR-17 |
| RAD-021 | PR-19 | RAD-058 | PR-14 | RAD-095 | PR-17 |
| RAD-022 | PR-19 | RAD-059 | PR-4 | RAD-096 | PR-17 |
| RAD-023 | PR-19 | RAD-060 | PR-6 | RAD-097 | PR-17 |
| RAD-024 | PR-19 | RAD-061 | PR-14 | RAD-098 | PR-17 |
| RAD-025 | PR-19 | RAD-062 | PR-14 | RAD-099 | PR-18 |
| RAD-026 | PR-10 | RAD-063 | PR-3 | RAD-100 | PR-10 |
| RAD-027 | PR-11 | RAD-064 | PR-1 | RAD-101 | PR-18 |
| RAD-028 | PR-11 | RAD-065 | PR-14 | RAD-102 | PR-10 |
| RAD-029 | PR-11 | RAD-066 | PR-15 | RAD-103 | PR-10 |
| RAD-030 | PR-11 | RAD-067 | PR-15 | RAD-104 | PR-18 |
| RAD-031 | PR-11 | RAD-068 | PR-15 | RAD-105 | PR-18 |
| RAD-032 | PR-11 | RAD-069 | PR-15 | RAD-106 | PR-18 |
| RAD-033 | PR-11 | RAD-070 | PR-15 | RAD-107 | PR-18 |
| RAD-034 | PR-11 | RAD-071 | PR-15 | RAD-108 | PR-21 |
| RAD-035 | PR-11 | RAD-072 | PR-15 | RAD-109 | PR-21 |
| RAD-036 | PR-11 | RAD-073 | PR-16 | RAD-110 | PR-21 |
| RAD-037 | PR-11 | RAD-074 | PR-16 | RAD-111 | PR-21 |

## Payment, inventory, auth, migrations

- PR-1 and PR-3 touch payment UI. They must not change `OrdersService` hold rules unless a failing test proves the bug is on the server.
- PR-5 and PR-8 are the migrations. Each needs a rollback note before merge. RAD-110 is the check, not a reason to migrate early.
- PR-7 is the only auth change. Do not bundle it with PR-5.
- Order status transitions stay in the API. Admin reconcile is still API-only; it is not in the 111 and must not be slipped into these PRs.
