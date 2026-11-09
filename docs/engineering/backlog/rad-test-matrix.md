# RAD test matrix

111 tasks. This audit ran none of these checks. Do not point them at production orders, payments, inventory, or migrations.

**auto** = Node test runner already in the repo (`tsx --test`). **staging** = disposable data. **device** = a real phone or a sized browser. There is no Playwright job in CI.

A Needs Verification task in the status doc stays unverified until the matching row here is actually run. A code read does not close it.

## Always

| Check | Command | When |
|---|---|---|
| Purchase and gateway | `npm run test:purchase --workspace @rad/api` | PR-1, PR-3, PR-4, PR-6, any order change |
| Inventory | `npm run test:inventory --workspace @rad/api` | any hold or cart change |
| Auth | `npm run test:auth --workspace @rad/api` | PR-7 |
| Admin unit tests | `npm test --workspace @rad/admin` | admin PRs |
| Storefront unit tests | `npm test --workspace @rad/storefront` | storefront PRs |
| Typecheck | `npm run typecheck:all` | every PR |
| Lint | `npm run lint` | every PR |

## By PR

### PR-1 RAD-064

| Case | Kind | Pass |
|---|---|---|
| Press «هنوز نه» after the order exists | staging | Order still pending payment. Work still held. Cart is not presented as a successful empty purchase |
| Cancel still uses the cancel control | staging | Order cancelled and restock rules unchanged |
| Manual card and gateway, if both exist in staging | staging | Same deferral rule |

### PR-2 RAD-052 RAD-053 RAD-055 (RAD-054 regression)

| Case | Kind | Pass |
|---|---|---|
| All 31 provinces present | auto | Count and names |
| City list follows province; province change clears city | auto | |
| Persian, Arabic, and Latin phone digits | auto | Stored Latin. Existing purchase test still passes |
| Too short, too long, empty | auto | Error after blur or submit, not before the user touches the field |
| Checkout submit | staging | Server rejects a bad phone even if the client is bypassed |

### PR-3 RAD-063

| Case | Kind | Pass |
|---|---|---|
| Copy card and copy amount | device iOS and Android | Success message, or a visible failure. Existing `payment-card.spec.ts` stays green |

### PR-4 RAD-059 RAD-039 RAD-045

| Case | Kind | Pass |
|---|---|---|
| Header, cart, checkout, success | staging | Same item count. Amount matches the order, not a second calculation |
| Sold, reserved, in-bag, loading | staging | PDP floating button and cart agree. In-bag is visually distinct |

### PR-5 RAD-014–018 RAD-086

| Case | Kind | Pass |
|---|---|---|
| Other user’s address id | auto | 404 or 403 |
| Edit name, email, phone | staging | Empty fields stay empty. No invented data |
| Delete an address used by an old order | staging | The order still shows the snapshot |
| Password change | staging | Old password fails. Sessions behave as specified |
| Checkout save into profile | staging | Happens only with the agreed consent control |

### PR-6 RAD-060

| Case | Kind | Pass |
|---|---|---|
| Note on checkout | staging | Stored, visible on the admin order, not required for payment approve |

### PR-7 RAD-001–005

| Case | Kind | Pass |
|---|---|---|
| OTP request, expiry, resend, attempt cap | auto + staging | No SMS in CI. Staging uses a test sender |
| Google cancel and deny | staging | No half-created session |
| Password login and reset | staging | Still work beside OTP |
| Reference match | blocked | Images for RAD-004 and RAD-005 are not in the repo |

### PR-8 RAD-006–009

| Case | Kind | Pass |
|---|---|---|
| Migration on a copy of the schema | staging | Current products keep a category. Rollback restores them |
| Cycle and delete | auto | Invalid parent and destructive delete rejected |
| PLP filter | staging | Real category and subcategory |

### PR-9 RAD-011–013

| Case | Kind | Pass |
|---|---|---|
| Two concurrent creates | auto | Unique codes or a bounded readable error |
| Same code on PDP, passport, order, admin | staging | One value |

### PR-10

| ID | Kind | Pass |
|---|---|---|
| RAD-026 | device | Home has no mineral banner and no empty strip |
| RAD-046 | device | Floating buy has no divider. Price and CTA still align |
| RAD-083 | staging | Named cards are gone. Payment and receipt actions that must remain are listed in the PR |
| RAD-089 | device | New CTA, still `/contact` |
| RAD-100 RAD-102 RAD-103 | staging | Custom-order CTA, answers survive PDP back, every card opens a PDP |

### PR-11 through PR-14, PR-17, PR-18

Render the named screen at 320, 390, and 1280, in Persian and English, before editing. Record the failing line. Reduced motion for RAD-051 and RAD-094. Do not restyle a screen that was not opened.

### PR-15 RAD-066–072

Reference match for RAD-066, RAD-067, and RAD-068 is blocked until «تصویر ۳» is in the repo. Scroll tasks RAD-069 and RAD-071: after a choice, the next question is in view and focus moves. RAD-072: reload keeps the confirmation id (already true for `sentId`) and shows the next step.

### PR-16 RAD-073–085

RAD-073 is a written map before UI. Then: tabs, making copy, swatches, raw permission values, photo and audio access, empty sections hidden, order cards, policies only for the agreed statuses, notifications limited to artist messages.

### PR-19 RAD-019–025

Blocked on the navbar, footer, and admin images except RAD-024 and RAD-025, which can be checked by installing to the iOS home screen and looking at the browser tab. Admin PWA (RAD-023) is a new manifest and worker. Do not reuse the storefront worker that `RouteScrollReset` currently unregisters.

### PR-21 RAD-108 RAD-109 RAD-110 RAD-111

| Case | Kind | Pass |
|---|---|---|
| PDP → cart → checkout → receipt or gateway return → success, failure, cancel | staging | Written script, two buyers, one disposable work |
| Keyboard, focus, contrast, RTL | device | One pass per shipped PR, not a single postponed audit |
| Migration rollback | staging copy | PR-5 and PR-8 only |
| Reference review | blocked | RAD-111 waits on the images |

## Non-goals

- No production migration.
- No live OTP or Google against production credentials.
- No bulk product deletion.
- No new test framework unless a later decision adds one. RAD-108 can be met with the staging script plus the existing purchase tests.
