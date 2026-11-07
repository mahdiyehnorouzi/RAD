# RAD task status

Authoritative list: `docs/RAD_Complete_Task_Backlog.xlsx`, sheet `Backlog`.
111 IDs, RAD-001 through RAD-111. No duplicate IDs. No missing IDs in that range.

The spreadsheet Status cell is «انجام‌نشده» on every row. That is the requester’s starting mark. The audit status below is from `origin/main` at `d0d28e1` and replaces it for planning. It does not rewrite the task text.

This checkout (`fix/admin-mobile-commission-date-drawer-height` at `944e086`) is behind `origin/main`. Where those trees differ, evidence was read from `origin/main`.

## Counts

Done 1 · Partial 32 · Missing 20 · Needs Verification 58. Total 111.

Done means the acceptance text is met by code plus a test or a direct reading of the rule. Needs Verification means the screen exists, or the request is visual or runtime, and this audit did not render it. A finished recovery issue is not proof that a UX task in this list is done.

## Design references

The workbook names reference labels and contains no embedded images. No image files for those labels were found under `docs/`. Visual comparison is blocked. No mock pixels were invented.

| Label in the sheet | Tasks |
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
| RAD-111 compares every label above | RAD-111 |

## Dependencies kept as written

These sheet dependencies do not match the technical predecessor. They are not edited in the task list:

- RAD-053 lists RAD-051. The data it needs is RAD-052.
- RAD-055 lists RAD-053. Phone checks need RAD-054, which is already done.
- RAD-045 lists RAD-038.
- RAD-074, RAD-076, RAD-077, and RAD-082 list RAD-070. The IA predecessor is RAD-073.
- RAD-075 lists RAD-071.
- RAD-088 lists RAD-084. The writing predecessor is RAD-087.
- RAD-097 lists RAD-051 and RAD-052. It needs RAD-052.

## Recovery issues

| Recovery issue | Overlap | Does not close |
|---|---|---|
| 01 Add to cart | RAD-039, RAD-059, RAD-108 | Button visuals, amount parity, browser e2e |
| 02 Inventory lifecycle | RAD-012, RAD-039 | Admin sold-filter and missing reconcile button are not RAD IDs |
| 03 Cart counters | RAD-059 | Amount and success-page parity |
| 04 PDP performance | RAD-043 | Server-component split is not a task in this list |
| 05 Related navigation | none | Keep the overlay working when touching RAD-040–043 |
| 06 Incorrect media | RAD-101 | Shape cards still link to passport (RAD-103) |
| 07 Two descriptions | none | Already shipped; not in this 111 |
| 08 Custom confirmation | RAD-072 | Success-screen redesign |
| 09 Commission lock | none | Already shipped; not in this 111 |
| 10 RAD number race | RAD-012 | Other business codes |
| 11 Immutable slug | none | Already enforced; not in this 111 |
| 12 Catalog revalidation | none | Webhook exists; no-ops without env; not in this 111 |
| 13 Homepage newest | none | Shipped; not in this 111 |
| 14 PLP availability sort | none | Shipped; not in this 111 |
| 15 Retire 13 products | none | Still blocked; not in this 111 |
| 16 Safe delete | RAD-110 | Future migrations |
| 17 Profile and addresses | RAD-014–018, RAD-086 | None of these are done |
| 18 Google | RAD-002 | Still missing |
| 19 Subcategories | RAD-006–009 | Still missing |
| 20 Artist applications | none | API exists, admin UI does not; not in this 111 |
| 21 Video overflow | none | Device only |
| 22 iPhone zoom | RAD-109 | Two controls were patched; the full pass remains |
| 23 Admin nav scroll | none | CSS exists; not in this 111 |
| 24 Latest Works layout | none | Device only |
| 25 Hero stacking | none | iOS only |

## Coverage

| ID | Epic | Priority | Audit status | PR |
|---|---|---|---|---|
| RAD-001 | هویت و ورود | P0 | Missing | PR-7 |
| RAD-002 | هویت و ورود | P1 | Missing | PR-7 |
| RAD-003 | هویت و ورود | P0 | Partial | PR-7 |
| RAD-004 | هویت و ورود | P1 | Needs Verification | PR-7 |
| RAD-005 | هویت و ورود | P1 | Needs Verification | PR-7 |
| RAD-006 | کاتالوگ و ادمین | P0 | Missing | PR-8 |
| RAD-007 | کاتالوگ و ادمین | P1 | Missing | PR-8 |
| RAD-008 | کاتالوگ و ادمین | P1 | Missing | PR-8 |
| RAD-009 | کاتالوگ و ادمین | P1 | Missing | PR-8 |
| RAD-010 | کاتالوگ و ادمین | P1 | Missing | PR-20 |
| RAD-011 | کاتالوگ و ادمین | P0 | Partial | PR-9 |
| RAD-012 | کاتالوگ و ادمین | P0 | Partial | PR-9 |
| RAD-013 | کاتالوگ و ادمین | P1 | Partial | PR-9 |
| RAD-014 | حساب کاربری و آدرس‌ها | P0 | Missing | PR-5 |
| RAD-015 | حساب کاربری و آدرس‌ها | P1 | Missing | PR-5 |
| RAD-016 | حساب کاربری و آدرس‌ها | P1 | Partial | PR-5 |
| RAD-017 | حساب کاربری و آدرس‌ها | P1 | Missing | PR-5 |
| RAD-018 | حساب کاربری و آدرس‌ها | P0 | Partial | PR-5 |
| RAD-019 | هویت بصری، ناوبری و PWA | P1 | Needs Verification | PR-19 |
| RAD-020 | هویت بصری، ناوبری و PWA | P1 | Needs Verification | PR-19 |
| RAD-021 | هویت بصری، ناوبری و PWA | P1 | Needs Verification | PR-19 |
| RAD-022 | هویت بصری، ناوبری و PWA | P1 | Needs Verification | PR-19 |
| RAD-023 | هویت بصری، ناوبری و PWA | P1 | Missing | PR-19 |
| RAD-024 | هویت بصری، ناوبری و PWA | P1 | Needs Verification | PR-19 |
| RAD-025 | هویت بصری، ناوبری و PWA | P1 | Partial | PR-19 |
| RAD-026 | هویت بصری، ناوبری و PWA | P2 | Missing | PR-10 |
| RAD-027 | PDP: محتوا و شناسنامه | P1 | Partial | PR-11 |
| RAD-028 | PDP: محتوا و شناسنامه | P1 | Partial | PR-11 |
| RAD-029 | PDP: محتوا و شناسنامه | P1 | Needs Verification | PR-11 |
| RAD-030 | PDP: محتوا و شناسنامه | P1 | Missing | PR-11 |
| RAD-031 | PDP: محتوا و شناسنامه | P1 | Missing | PR-11 |
| RAD-032 | PDP: محتوا و شناسنامه | P2 | Needs Verification | PR-11 |
| RAD-033 | PDP: محتوا و شناسنامه | P2 | Needs Verification | PR-11 |
| RAD-034 | PDP: محتوا و شناسنامه | P1 | Needs Verification | PR-11 |
| RAD-035 | PDP: محتوا و شناسنامه | P2 | Needs Verification | PR-11 |
| RAD-036 | PDP: محتوا و شناسنامه | P2 | Needs Verification | PR-11 |
| RAD-037 | PDP: محتوا و شناسنامه | P1 | Needs Verification | PR-11 |
| RAD-038 | PDP: محتوا و شناسنامه | P2 | Needs Verification | PR-11 |
| RAD-039 | PDP: گالری و خرید | P0 | Partial | PR-4 |
| RAD-040 | PDP: گالری و خرید | P1 | Needs Verification | PR-12 |
| RAD-041 | PDP: گالری و خرید | P1 | Needs Verification | PR-12 |
| RAD-042 | PDP: گالری و خرید | P1 | Partial | PR-12 |
| RAD-043 | PDP: گالری و خرید | P1 | Needs Verification | PR-12 |
| RAD-044 | PDP: گالری و خرید | P1 | Needs Verification | PR-12 |
| RAD-045 | PDP: گالری و خرید | P1 | Partial | PR-4 |
| RAD-046 | PDP: گالری و خرید | P2 | Missing | PR-10 |
| RAD-047 | PDP: گالری و خرید | P1 | Partial | PR-12 |
| RAD-048 | Cart | P1 | Needs Verification | PR-13 |
| RAD-049 | Cart | P2 | Needs Verification | PR-13 |
| RAD-050 | Cart | P1 | Needs Verification | PR-13 |
| RAD-051 | Checkout: آدرس و UX | P2 | Needs Verification | PR-14 |
| RAD-052 | Checkout: آدرس و UX | P0 | Partial | PR-2 |
| RAD-053 | Checkout: آدرس و UX | P0 | Missing | PR-2 |
| RAD-054 | Checkout: آدرس و UX | P0 | Done | PR-2 |
| RAD-055 | Checkout: آدرس و UX | P0 | Partial | PR-2 |
| RAD-056 | Checkout: آدرس و UX | P1 | Needs Verification | PR-14 |
| RAD-057 | Checkout: آدرس و UX | P1 | Needs Verification | PR-14 |
| RAD-058 | Checkout: آدرس و UX | P1 | Needs Verification | PR-14 |
| RAD-059 | Checkout: آدرس و UX | P0 | Partial | PR-4 |
| RAD-060 | Checkout: آدرس و UX | P1 | Missing | PR-6 |
| RAD-061 | Checkout: آدرس و UX | P1 | Needs Verification | PR-14 |
| RAD-062 | Checkout: آدرس و UX | P1 | Needs Verification | PR-14 |
| RAD-063 | Checkout: آدرس و UX | P0 | Partial | PR-3 |
| RAD-064 | Checkout: آدرس و UX | P0 | Partial | PR-1 |
| RAD-065 | Checkout: آدرس و UX | P2 | Needs Verification | PR-14 |
| RAD-066 | سفارش اختصاصی: ثبت درخواست | P1 | Needs Verification | PR-15 |
| RAD-067 | سفارش اختصاصی: ثبت درخواست | P1 | Needs Verification | PR-15 |
| RAD-068 | سفارش اختصاصی: ثبت درخواست | P1 | Needs Verification | PR-15 |
| RAD-069 | سفارش اختصاصی: ثبت درخواست | P1 | Needs Verification | PR-15 |
| RAD-070 | سفارش اختصاصی: ثبت درخواست | P1 | Needs Verification | PR-15 |
| RAD-071 | سفارش اختصاصی: ثبت درخواست | P1 | Needs Verification | PR-15 |
| RAD-072 | سفارش اختصاصی: ثبت درخواست | P1 | Partial | PR-15 |
| RAD-073 | پروفایل: سفارش‌ها و ساخت | P0 | Needs Verification | PR-16 |
| RAD-074 | پروفایل: سفارش‌ها و ساخت | P1 | Needs Verification | PR-16 |
| RAD-075 | پروفایل: سفارش‌ها و ساخت | P1 | Partial | PR-16 |
| RAD-076 | پروفایل: سفارش‌ها و ساخت | P1 | Needs Verification | PR-16 |
| RAD-077 | پروفایل: سفارش‌ها و ساخت | P1 | Needs Verification | PR-16 |
| RAD-078 | پروفایل: سفارش‌ها و ساخت | P1 | Needs Verification | PR-16 |
| RAD-079 | پروفایل: سفارش‌ها و ساخت | P2 | Partial | PR-16 |
| RAD-080 | پروفایل: سفارش‌ها و ساخت | P1 | Partial | PR-16 |
| RAD-081 | پروفایل: سفارش‌ها و ساخت | P1 | Needs Verification | PR-16 |
| RAD-082 | پروفایل: سفارش‌ها و ساخت | P1 | Needs Verification | PR-16 |
| RAD-083 | پروفایل: سفارش‌ها و ساخت | P2 | Missing | PR-10 |
| RAD-084 | پروفایل: سفارش‌ها و ساخت | P1 | Partial | PR-16 |
| RAD-085 | پروفایل: سفارش‌ها و ساخت | P1 | Partial | PR-16 |
| RAD-086 | پروفایل: سفارش‌ها و ساخت | P1 | Partial | PR-5 |
| RAD-087 | صفحات محتوایی و همکاری | P1 | Partial | PR-17 |
| RAD-088 | صفحات محتوایی و همکاری | P2 | Needs Verification | PR-17 |
| RAD-089 | صفحات محتوایی و همکاری | P1 | Partial | PR-10 |
| RAD-090 | صفحات محتوایی و همکاری | P2 | Needs Verification | PR-17 |
| RAD-091 | صفحات محتوایی و همکاری | P2 | Needs Verification | PR-17 |
| RAD-092 | صفحات محتوایی و همکاری | P2 | Needs Verification | PR-17 |
| RAD-093 | صفحات محتوایی و همکاری | P1 | Needs Verification | PR-17 |
| RAD-094 | صفحات محتوایی و همکاری | P2 | Needs Verification | PR-17 |
| RAD-095 | صفحات محتوایی و همکاری | P1 | Needs Verification | PR-17 |
| RAD-096 | صفحات محتوایی و همکاری | P1 | Needs Verification | PR-17 |
| RAD-097 | صفحات محتوایی و همکاری | P1 | Partial | PR-17 |
| RAD-098 | صفحات محتوایی و همکاری | P1 | Needs Verification | PR-17 |
| RAD-099 | Shape، Passport و سایر صفحات | P1 | Needs Verification | PR-18 |
| RAD-100 | Shape، Passport و سایر صفحات | P1 | Missing | PR-10 |
| RAD-101 | Shape، Passport و سایر صفحات | P0 | Partial | PR-18 |
| RAD-102 | Shape، Passport و سایر صفحات | P1 | Missing | PR-10 |
| RAD-103 | Shape، Passport و سایر صفحات | P1 | Partial | PR-10 |
| RAD-104 | Shape، Passport و سایر صفحات | P1 | Needs Verification | PR-18 |
| RAD-105 | Shape، Passport و سایر صفحات | P2 | Needs Verification | PR-18 |
| RAD-106 | Shape، Passport و سایر صفحات | P2 | Needs Verification | PR-18 |
| RAD-107 | Shape، Passport و سایر صفحات | P2 | Needs Verification | PR-18 |
| RAD-108 | کیفیت و انتشار | P0 | Partial | PR-21 |
| RAD-109 | کیفیت و انتشار | P0 | Needs Verification | PR-21 |
| RAD-110 | کیفیت و انتشار | P0 | Partial | PR-21 |
| RAD-111 | کیفیت و انتشار | P1 | Needs Verification | PR-21 |

Every ID in the coverage table appears again in the task sections and in `rad-execution-plan.md`.

## Tasks

### RAD-001 — ورود با رمز یکبارمصرف (OTP)

- **Epic:** هویت و ورود
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** درخواست، ارسال، اعتبارسنجی، انقضا، محدودیت تلاش و ارسال مجدد OTP در موبایل و دسکتاپ کار کند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** No OTP routes on origin/main. Auth routes are me, session, register, password, password/forgot, password/reset, logout (apps/api/src/auth/auth.controller.ts). Draft PRs #106, #107, and #108 are unmerged.
- **Missing requirements:** درخواست، ارسال، اعتبارسنجی، انقضا، محدودیت تلاش و ارسال مجدد OTP در موبایل و دسکتاپ کار کند.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** high
- **Tests:** `rad-test-matrix.md` section PR-7. A code read does not close a device or reference-match acceptance.
- **PR:** PR-7

### RAD-002 — ورود با گوگل

- **Epic:** هویت و ورود
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** ورود/ثبت‌نام گوگل، اتصال حساب موجود و خطاهای لغو/رد دسترسی تست شوند.
- **Dependencies (as written):** RAD-001
- **Design reference:** none
- **Evidence:** No Google token exchange on main. auth.service.spec.ts only checks that a null passwordHash returns the same bad_credentials shape. Draft PR #108 includes a Google button and is unmerged.
- **Missing requirements:** ورود/ثبت‌نام گوگل، اتصال حساب موجود و خطاهای لغو/رد دسترسی تست شوند.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** high
- **Tests:** `rad-test-matrix.md` section PR-7. A code read does not close a device or reference-match acceptance.
- **PR:** PR-7

### RAD-003 — ورود با رمز عبور

- **Epic:** هویت و ورود
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** ورود امن با شناسه معتبر و رمز، مدیریت خطا و بازیابی رمز و نشست کار کند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Email and password sign-in, signup, forgot, and reset exist in apps/storefront/components/account/account-page/account-login.tsx and apps/storefront/lib/api/auth.ts. The identifier is email. This audit did not submit a login.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-7. A code read does not close a device or reference-match acceptance.
- **PR:** PR-7

### RAD-004 — ریدیزاین صفحه ورود مشتری

- **Epic:** هویت و ورود
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** ورود مطابق تصویر مرجع، RTL و responsive، تب OTP/رمز و گوگل با حالت‌های خطا/لودینگ.
- **Dependencies (as written):** RAD-001,RAD-002,RAD-003
- **Design reference:** تصویر ۲: Login
- **Evidence:** Code inspection of apps/storefront/components/account/account-page/account-login.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-7. A code read does not close a device or reference-match acceptance.
- **PR:** PR-7

### RAD-005 — ریدیزاین ورود ادمین

- **Epic:** هویت و ورود
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** صفحه ورود ادمین مطابق مرجع، responsive، امن و سازگار با مجوزهای کارکنان.
- **Dependencies (as written):** RAD-003
- **Design reference:** تصویر ۵: Admin login
- **Evidence:** Code inspection of apps/admin/components/reset-password-page.tsx and the admin login view on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-7. A code read does not close a device or reference-match acceptance.
- **PR:** PR-7

### RAD-006 — مدل داده دسته‌بندی و زیردسته

- **Epic:** کاتالوگ و ادمین
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** دسته/زیردسته با شناسه پایدار، رابطه والد-فرزند و migration امن؛ رفتار محصولات فعلی حفظ شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** ProductCategory in packages/types/src/index.ts is a flat union. There is no parent/child table and no migration.
- **Missing requirements:** دسته/زیردسته با شناسه پایدار، رابطه والد-فرزند و migration امن؛ رفتار محصولات فعلی حفظ شود.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** high
- **Tests:** `rad-test-matrix.md` section PR-8. A code read does not close a device or reference-match acceptance.
- **PR:** PR-8

### RAD-007 — CRUD دسته‌بندی در ادمین

- **Epic:** کاتالوگ و ادمین
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** ادمین ایجاد، ویرایش، غیرفعال‌سازی و مشاهده دسته‌بندی را با اعتبارسنجی انجام دهد.
- **Dependencies (as written):** RAD-006
- **Design reference:** none
- **Evidence:** Admin sets a product category from that enum in admin-dashboard.tsx. There is no category CRUD.
- **Missing requirements:** ادمین ایجاد، ویرایش، غیرفعال‌سازی و مشاهده دسته‌بندی را با اعتبارسنجی انجام دهد.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-8. A code read does not close a device or reference-match acceptance.
- **PR:** PR-8

### RAD-008 — CRUD زیردسته در ادمین

- **Epic:** کاتالوگ و ادمین
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** تعریف/ویرایش زیردسته و ارتباط با دسته اصلی، جلوگیری از حذف مخرب و چرخه نامعتبر.
- **Dependencies (as written):** RAD-006,RAD-007
- **Design reference:** none
- **Evidence:** No subcategory entity or admin screen.
- **Missing requirements:** تعریف/ویرایش زیردسته و ارتباط با دسته اصلی، جلوگیری از حذف مخرب و چرخه نامعتبر.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-8. A code read does not close a device or reference-match acceptance.
- **PR:** PR-8

### RAD-009 — اتصال دسته/زیردسته به محصول و فیلترها

- **Epic:** کاتالوگ و ادمین
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** ثبت و ویرایش محصول، storefront و فیلترها دسته‌های واقعی را نمایش دهند.
- **Dependencies (as written):** RAD-006,RAD-007,RAD-008
- **Design reference:** none
- **Evidence:** Storefront filters use the flat enum under apps/storefront/lib/catalog. They cannot show subcategories that do not exist.
- **Missing requirements:** ثبت و ویرایش محصول، storefront و فیلترها دسته‌های واقعی را نمایش دهند.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-8. A code read does not close a device or reference-match acceptance.
- **PR:** PR-8

### RAD-010 — تعریف فلوی استوری آثار از ادمین

- **Epic:** کاتالوگ و ادمین
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** ادمین بتواند مراحل، متن، رسانه و ترتیب فلوی داستان اثر را تعریف و منتشر کند؛ نسخه پیش‌نمایش داشته باشد.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Works have description and subtitle. There is no ordered, admin-defined story flow with preview.
- **Missing requirements:** ادمین بتواند مراحل، متن، رسانه و ترتیب فلوی داستان اثر را تعریف و منتشر کند؛ نسخه پیش‌نمایش داشته باشد.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-20. A code read does not close a device or reference-match acceptance.
- **PR:** PR-20

### RAD-011 — ممیزی کدهای یکتا در کل سیستم

- **Epic:** کاتالوگ و ادمین
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** تمام کدهای محصول، سفارش، اثر، شناسنامه و هر شناسه کسب‌وکاری شناسایی و منبع تولید مشخص شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Known generators are listed in rad-audit.md (rad number, slug, order id, commission id, passport code derived from the work). This pass does not claim every message template was traced.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-9. A code read does not close a device or reference-match acceptance.
- **PR:** PR-9

### RAD-012 — تضمین یکتایی کدها در Backend و DB

- **Epic:** کاتالوگ و ادمین
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** Unique constraint/index مناسب، مدیریت همزمانی، retry محدود و خطای قابل فهم؛ تست race condition.
- **Dependencies (as written):** RAD-011
- **Design reference:** none
- **Evidence:** Product.radNumber and slug are unique. createProductWithRadNumber retries (admin.service.ts, rad-number-race.spec.ts). Email, payment authority, and cart owner+slug are unique. Order, commission, and passport codes do not all have the same race test.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** high
- **Tests:** `rad-test-matrix.md` section PR-9. A code read does not close a device or reference-match acceptance.
- **PR:** PR-9

### RAD-013 — نمایش و یکسان‌سازی کدهای یکتا در همه صفحات

- **Epic:** کاتالوگ و ادمین
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** کد در ادمین، PDP، passport، سفارش‌ها و پیام‌ها یکسان و قابل ردیابی باشد.
- **Dependencies (as written):** RAD-012
- **Design reference:** none
- **Evidence:** RAD numbers appear on the PDP, in admin, and on order lines. Passport, email, and admin message parity was not fully traced.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-9. A code read does not close a device or reference-match acceptance.
- **PR:** PR-9

### RAD-014 — مدل پروفایل و آدرس‌های چندگانه

- **Epic:** حساب کاربری و آدرس‌ها
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** نام، نام خانوادگی، ایمیل، شماره تماس، آدرس‌های چندگانه و آدرس پیش‌فرض با مجوز مالک تعریف شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** User is name, email, passwordHash, and role (user.entity.ts). No family name, phone, or address table.
- **Missing requirements:** نام، نام خانوادگی، ایمیل، شماره تماس، آدرس‌های چندگانه و آدرس پیش‌فرض با مجوز مالک تعریف شود.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** high
- **Tests:** `rad-test-matrix.md` section PR-5. A code read does not close a device or reference-match acceptance.
- **PR:** PR-5

### RAD-015 — فرم مشاهده/ویرایش اطلاعات پروفایل

- **Epic:** حساب کاربری و آدرس‌ها
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** فیلدهای خالی بدون داده ساختگی، اعتبارسنجی و ذخیره تغییرات نام/ایمیل/شماره.
- **Dependencies (as written):** RAD-014
- **Design reference:** none
- **Evidence:** AccountInfoPage shows name, email, and logout, and does not edit them.
- **Missing requirements:** فیلدهای خالی بدون داده ساختگی، اعتبارسنجی و ذخیره تغییرات نام/ایمیل/شماره.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-5. A code read does not close a device or reference-match acceptance.
- **PR:** PR-5

### RAD-016 — تغییر رمز عبور در پروفایل

- **Epic:** حساب کاربری و آدرس‌ها
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** برای حساب رمزدار تغییر رمز امن، کنترل نشست و پیام موفق/خطا وجود داشته باشد.
- **Dependencies (as written):** RAD-003
- **Design reference:** none
- **Evidence:** PATCH /auth/password exists. The profile page has no password form.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-5. A code read does not close a device or reference-match acceptance.
- **PR:** PR-5

### RAD-017 — مدیریت آدرس‌ها در پروفایل

- **Epic:** حساب کاربری و آدرس‌ها
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** افزودن، ویرایش، حذف و تعیین پیش‌فرض چند آدرس بدون از بین رفتن آدرس سفارش‌های قبلی.
- **Dependencies (as written):** RAD-014
- **Design reference:** none
- **Evidence:** No address book. Checkout keeps one draft in sessionStorage (checkout-page.tsx).
- **Missing requirements:** افزودن، ویرایش، حذف و تعیین پیش‌فرض چند آدرس بدون از بین رفتن آدرس سفارش‌های قبلی.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-5. A code read does not close a device or reference-match acceptance.
- **PR:** PR-5

### RAD-018 — همگام‌سازی اطلاعات Checkout با پروفایل

- **Epic:** حساب کاربری و آدرس‌ها
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** داده ثبت‌شده در Checkout با رضایت/رفتار مشخص در پروفایل ذخیره شود؛ آدرس سفارش snapshot مستقل داشته باشد.
- **Dependencies (as written):** RAD-014,RAD-017
- **Design reference:** none
- **Evidence:** The order stores the checkout address. Nothing copies it onto a profile, and there is no consent step.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** high
- **Tests:** `rad-test-matrix.md` section PR-5. A code read does not close a device or reference-match acceptance.
- **PR:** PR-5

### RAD-019 — ریدیزاین Navbar موبایل

- **Epic:** هویت بصری، ناوبری و PWA
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** هدر و منوی موبایل مطابق مرجع، RTL، حالات باز/بسته، آیکون‌ها، لینک‌ها و اندازه‌های مختلف.
- **Dependencies (as written):** none
- **Design reference:** تصویر ۴: Navbar Mobile
- **Evidence:** Code inspection of apps/storefront/components/layout/header/header.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-19. A code read does not close a device or reference-match acceptance.
- **PR:** PR-19

### RAD-020 — ریدیزاین Navbar دسکتاپ

- **Epic:** هویت بصری، ناوبری و PWA
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** هدر پیش‌فرض و scrolled، بدون تغییر بی‌دلیل ساختار اصلی و با تست sticky.
- **Dependencies (as written):** none
- **Design reference:** تصویر ۴: Navbar Desktop
- **Evidence:** Code inspection of apps/storefront/components/layout/header/header.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-19. A code read does not close a device or reference-match acceptance.
- **PR:** PR-19

### RAD-021 — ریدیزاین Footer موبایل

- **Epic:** هویت بصری، ناوبری و PWA
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** فوتر جمع‌وجور با آکاردئون، لینک‌های درست و فضای خالی کنترل‌شده.
- **Dependencies (as written):** none
- **Design reference:** تصویر ۴: Footer Mobile
- **Evidence:** Code inspection of apps/storefront/components/layout/chrome/footer/footer.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-19. A code read does not close a device or reference-match acceptance.
- **PR:** PR-19

### RAD-022 — ریدیزاین Footer دسکتاپ

- **Epic:** هویت بصری، ناوبری و PWA
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** ستون‌بندی منظم، متن و فاصله مناسب و هماهنگی با برند.
- **Dependencies (as written):** none
- **Design reference:** تصویر ۴: Footer Desktop
- **Evidence:** Code inspection of apps/storefront/components/layout/chrome/footer/footer.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-19. A code read does not close a device or reference-match acceptance.
- **PR:** PR-19

### RAD-023 — راه‌اندازی PWA ادمین

- **Epic:** هویت بصری، ناوبری و PWA
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** manifest، icon، installability، service worker/cache ایمن، offline/fallback و به‌روزرسانی درست.
- **Dependencies (as written):** none
- **Design reference:** تصویر ۵: Admin
- **Evidence:** Storefront has app/manifest.ts and public/sw.js. Admin has neither. PwaRegistrar is commented out and RouteScrollReset unregisters workers on each load.
- **Missing requirements:** manifest، icon، installability، service worker/cache ایمن، offline/fallback و به‌روزرسانی درست.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-19. A code read does not close a device or reference-match acceptance.
- **PR:** PR-19

### RAD-024 — آیکون باکیفیت Add to Home Screen آیفون

- **Epic:** هویت بصری، ناوبری و PWA
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** apple-touch-icon واقعی با رزولوشن مناسب، بدون کشش و blur؛ تست روی iOS.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/app/icon.png on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-19. A code read does not close a device or reference-match acceptance.
- **PR:** PR-19

### RAD-025 — اصلاح favicon مرورگر

- **Epic:** هویت بصری، ناوبری و PWA
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** لوگوی اصلی RAD در favicon/metadata و نسخه‌های light/dark و cache درست دیده شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** apps/storefront/app/icon.png is the icon. Separate light and dark favicon files were not found.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-19. A code read does not close a device or reference-match acceptance.
- **PR:** PR-19

### RAD-026 — حذف موقت نوار اطلاع‌رسانی بالای Home

- **Epic:** هویت بصری، ناوبری و PWA
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** بخش با کلاس flex min-h-10 ... bg-rad-mineral از هوم حذف شود؛ فضای خالی باقی نماند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** HomeBanner is mounted from app/[locale]/layout.tsx and renders RadBanner (packages/ui/src/rad-banner.tsx), which still uses flex min-h-10 and bg-rad-mineral.
- **Missing requirements:** بخش با کلاس flex min-h-10 ... bg-rad-mineral از هوم حذف شود؛ فضای خالی باقی نماند.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-10. A code read does not close a device or reference-match acceptance.
- **PR:** PR-10

### RAD-027 — حذف نشان ۱/۱ از عنوان PDP

- **Epic:** PDP: محتوا و شناسنامه
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** نشان ۱/۱ از قسمت عنوان حذف شود؛ اطلاعات یکتا بودن در جای مناسب حفظ شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** product-summary.tsx still renders the 1/1 mark directly above the h1.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-11. A code read does not close a device or reference-match acceptance.
- **PR:** PR-11

### RAD-028 — اصلاح پیام وضعیت محصول فروخته‌شده

- **Epic:** PDP: محتوا و شناسنامه
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** متن طولانی «این رَد فروخته شده ...» حذف و پیام «این رد صاحبش را پیدا کرده» در جای درست قرار گیرد.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** pdp-copy.ts has both strings. soldFoundNote is the context line, and the long soldNote is still under the buy button in product-summary.tsx.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-11. A code read does not close a device or reference-match acceptance.
- **PR:** PR-11

### RAD-029 — بازنویسی بخش assurances

- **Epic:** PDP: محتوا و شناسنامه
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** متن‌های product-summary ... assurances کوتاه، روشن و بدون ادعای غیرقابل‌تضمین شوند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/product-detail/product-summary.tsx PDP_ASSURANCES on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-11. A code read does not close a device or reference-match acceptance.
- **PR:** PR-11

### RAD-030 — تحقیق UX برای نمایش هویت یکتای هر اثر

- **Epic:** PDP: محتوا و شناسنامه
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** مفهوم شماره مخصوص و شناسنامه اختصاصی بدون اتکا به QR موبایل بررسی و راهکار نهایی مستند شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** No research note in docs/ chooses a unique-identity pattern that does not depend on a mobile QR.
- **Missing requirements:** مفهوم شماره مخصوص و شناسنامه اختصاصی بدون اتکا به QR موبایل بررسی و راهکار نهایی مستند شود.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-11. A code read does not close a device or reference-match acceptance.
- **PR:** PR-11

### RAD-031 — یکپارچه‌سازی کارت QR و passport

- **Epic:** PDP: محتوا و شناسنامه
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** QR حذف؛ عکس تکراری محصول از passportCard برداشته؛ دو کارت در یک بخش منسجم ادغام شوند.
- **Dependencies (as written):** RAD-030
- **Design reference:** none
- **Evidence:** QR surfaces remain (product-qr, record cards). The passport card still carries product imagery. Blocked on RAD-030.
- **Missing requirements:** QR حذف؛ عکس تکراری محصول از passportCard برداشته؛ دو کارت در یک بخش منسجم ادغام شوند.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-11. A code read does not close a device or reference-match acceptance.
- **PR:** PR-11

### RAD-032 — بازطراحی sectionMark مشخصات

- **Epic:** PDP: محتوا و شناسنامه
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** نشان تزئینی به پس‌زمینه سمت چپ منتقل و فضای اشغال‌شده کم شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/product-detail/product-specs.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-11. A code read does not close a device or reference-match acceptance.
- **PR:** PR-11

### RAD-033 — جایگزینی خط before در sectionIndex

- **Epic:** PDP: محتوا و شناسنامه
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** خط تزئینی با متن/نشان خوانای مورد تأیید جایگزین شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/product-detail/pdp-section.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-11. A code read does not close a device or reference-match acceptance.
- **PR:** PR-11

### RAD-034 — هماهنگی آیکون‌های مشخصات و ترتیب متن

- **Epic:** PDP: محتوا و شناسنامه
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** همه specIconها یک سبک داشته باشند و جای عنوان/توضیح طبق درخواست جابه‌جا شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/product-detail/product-specs.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-11. A code read does not close a device or reference-match acceptance.
- **PR:** PR-11

### RAD-035 — حذف مسیر ساخت از مشخصات PDP

- **Epic:** PDP: محتوا و شناسنامه
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** بخش مسیر ساخت از مشخصات PDP حذف شود؛ داده در بخش مرتبط در صورت نیاز باقی بماند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/product-detail/product-making.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-11. A code read does not close a device or reference-match acceptance.
- **PR:** PR-11

### RAD-036 — جابجایی آیکون‌های مراقبت از اثر

- **Epic:** PDP: محتوا و شناسنامه
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** آیکون‌ها سمت راست متن‌ها در RTL و aligned نمایش داده شوند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/product-detail/product-care.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-11. A code read does not close a device or reference-match acceptance.
- **PR:** PR-11

### RAD-037 — انتقال ارسال، بسته‌بندی و پرسش‌ها

- **Epic:** PDP: محتوا و شناسنامه
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** این محتوا از کارت مشخصات جدا و در جای مناسب با تست UX قرار گیرد.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/product-detail/product-questions.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-11. A code read does not close a device or reference-match acceptance.
- **PR:** PR-11

### RAD-038 — کاهش فاصله آثار مشابه تا Footer

- **Epic:** PDP: محتوا و شناسنامه
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** فاصله در موبایل و دسکتاپ مطابق spacing system کاهش یابد.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/product-detail/related-works.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-11. A code read does not close a device or reference-match acceptance.
- **PR:** PR-11

### RAD-039 — یکسان‌سازی state دکمه خرید شناور

- **Epic:** PDP: گالری و خرید
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** sold/reserved/available/in-cart/loading با CTA، disabled و رفتار یکسان در PDP و cart.
- **Dependencies (as written):** RAD-012
- **Design reference:** none
- **Evidence (2026-11-07, branch `feat/rad-039-pdp-purchase-state`):** PDP `ProductDetail` lifts `addPending` and passes it to inline `ProductSummary` and `ProductFloatingBuy`. Opt-in `AddToBag` `pending` + `components/catalog/add-to-bag-pending.ts` keeps both CTAs disabled with busy copy/`aria-busy` while either cart `add()` is in flight; floating bar mirrors pending with spinner chrome when the peer CTA initiated the request. Unit: `features/product-detail/pdp-add-pending.spec.ts`; existing `purchase-view.spec.ts` unchanged. **Not verified:** manual/browser pass across available / in-bag / reserved / sold / scroll-during-add; cart-page button parity (out of scope for this change).
- **Missing requirements:** Browser QA on local/test stack; cart CTA parity if still required by sheet acceptance wording.
- **Frontend:** Shared pending implemented; visual parity across states still needs device check.
- **Backend / database:** none (no API changes)
- **Regression risk:** medium
- **Tests:** `npm run test --workspace @rad/storefront` includes `pdp-add-pending.spec.ts` and `purchase-view.spec.ts`; browser e2e not run.
- **PR:** PR-4

### RAD-040 — رفع تأخیر شمارنده گالری

- **Epic:** PDP: گالری و خرید
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** شماره تصویر همزمان با next/previous و بدون lag به‌روز شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/product-detail/product-gallery.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-12. A code read does not close a device or reference-match acceptance.
- **PR:** PR-12

### RAD-041 — خوانایی دکمه‌های گالری fullscreen

- **Epic:** PDP: گالری و خرید
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** کنتراست/پس‌زمینه دکمه‌های قبلی/بعدی روی تصاویر روشن و تیره مناسب باشد.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/product-detail/pdp-lightbox.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-12. A code read does not close a device or reference-match acceptance.
- **PR:** PR-12

### RAD-042 — پشتیبانی swipe افقی در گالری fullscreen

- **Epic:** PDP: گالری و خرید
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** swipe روی موبایل تصویر را عوض کند، بدون تداخل با scroll صفحه و zoom.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** pdp-lightbox.tsx has pointer down, move, and up handlers. Conflict with page scroll and pinch-zoom was not tried on a phone.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-12. A code read does not close a device or reference-match acceptance.
- **PR:** PR-12

### RAD-043 — بهبود performance جابه‌جایی تصاویر

- **Epic:** PDP: گالری و خرید
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** جابه‌جایی تصاویر/آیتم‌ها روان باشد؛ با پروفایل قبل/بعد و جلوگیری از re-render اضافی.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/product-detail/pdp-lightbox.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-12. A code read does not close a device or reference-match acceptance.
- **PR:** PR-12

### RAD-044 — جابجایی toast افزودن به کیسه

- **Epic:** PDP: گالری و خرید
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** toast روی دکمه شناور قرار نگیرد و تعامل خرید را مسدود نکند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/product-detail/product-floating-buy.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-12. A code read does not close a device or reference-match acceptance.
- **PR:** PR-12

### RAD-045 — طراحی حالت «رفتن به کیسه»

- **Epic:** PDP: گالری و خرید
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** CTA در حالت in-cart رنگ و آیکون متمایز داشته باشد و ترتیب آیکون‌های چپ/راست اصلاح شود.
- **Dependencies (as written):** RAD-038
- **Design reference:** none
- **Evidence:** The in-bag state is a go-to-bag link with two icons in product-floating-buy.tsx. Color and icon order were not visually checked.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-4. A code read does not close a device or reference-match acceptance.
- **PR:** PR-4

### RAD-046 — حذف divider دکمه شناور

- **Epic:** PDP: گالری و خرید
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** product-floating-buy ... divider حذف و فاصله‌ها اصلاح شوند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** styles.divider is still rendered in product-floating-buy.tsx.
- **Missing requirements:** product-floating-buy ... divider حذف و فاصله‌ها اصلاح شوند.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-10. A code read does not close a device or reference-match acceptance.
- **PR:** PR-10

### RAD-047 — برگشت از Cart به صفحه قبلی

- **Epic:** PDP: گالری و خرید
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** Back قابل مشاهده و قابل پیش‌بینی، با fallback امن برای ورود مستقیم به cart.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** A shared back control exists in the storefront chrome. The cart direct-entry fallback was not exercised.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-12. A code read does not close a device or reference-match acceptance.
- **PR:** PR-12

### RAD-048 — هماهنگ‌سازی typography صفحه Cart

- **Epic:** Cart
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** سایز و وزن فونت‌ها از design tokens مشترک استفاده کند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront cart feature styles on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-13. A code read does not close a device or reference-match acceptance.
- **PR:** PR-13

### RAD-049 — بازنویسی متن آثار خارج‌شده از کیسه

- **Epic:** Cart
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** متن «این آثار از کیسه‌ی شما خارج شدند» با متن روشن و توضیح دلیل جایگزین شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront cart removed-item copy on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-13. A code read does not close a device or reference-match acceptance.
- **PR:** PR-13

### RAD-050 — شفاف‌سازی CTA ادامه مرور آثار

- **Epic:** Cart
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** عبارت «ادامه‌ی دیدن آثار» و جایگاه/رفتارش بازطراحی شود تا مقصد معلوم باشد.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront cart continue CTA on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-13. A code read does not close a device or reference-match acceptance.
- **PR:** PR-13

### RAD-051 — انیمیشن استپر Checkout

- **Epic:** Checkout: آدرس و UX
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** موشن ظریف، سریع، قابل‌دسترس و احترام به reduced motion.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/components/checkout/checkout-payment/checkout-payment.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-14. A code read does not close a device or reference-match acceptance.
- **PR:** PR-14

### RAD-052 — داده کامل استان‌های ایران

- **Epic:** Checkout: آدرس و UX
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** تمام استان‌ها در انتخابگر با منبع داده قابل نگهداری و نام صحیح.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** lib/geo/iran-cities.ts is a flat city list. The checkout label says استان / شهر (checkout-copy.ts). There is no province list.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-2. A code read does not close a device or reference-match acceptance.
- **PR:** PR-2

### RAD-053 — داده و انتخابگر شهر وابسته به استان

- **Epic:** Checkout: آدرس و UX
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** انتخاب استان، فهرست شهرها را فیلتر کند؛ تغییر استان شهر قبلی را پاک کند.
- **Dependencies (as written):** RAD-051
- **Design reference:** none
- **Evidence:** city-select.tsx uses that flat list. A province cannot filter cities. The sheet depends on RAD-051; the data dependency is RAD-052.
- **Missing requirements:** انتخاب استان، فهرست شهرها را فیلتر کند؛ تغییر استان شهر قبلی را پاک کند.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-2. A code read does not close a device or reference-match acceptance.
- **PR:** PR-2

### RAD-054 — نرمال‌سازی ارقام فارسی و عربی شماره تماس

- **Epic:** Checkout: آدرس و UX
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Done
- **Acceptance criteria:** ورودی فارسی/عربی به ارقام لاتین در داده استاندارد تبدیل شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** latinDigits in apps/api/src/orders/payment-receipt.ts maps Persian and Arabic digits. purchase-flow.spec.ts stores ۰۹۱۲۱۲۳۴۵۶۷ as 09121234567. Storefront toLatinDigits does the same before submit.
- **Missing requirements:** none
- **Frontend:** none
- **Backend / database:** none
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-2. A code read does not close a device or reference-match acceptance.
- **PR:** PR-2

### RAD-055 — فرمت و اعتبارسنجی لحظه‌ای شماره تماس

- **Epic:** Checkout: آدرس و UX
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** فرمت قابل خواندن، خطا پس از تعامل کاربر، اعتبارسنجی client/server و دسترس‌پذیری.
- **Dependencies (as written):** RAD-053
- **Design reference:** none
- **Evidence:** Checkout checks length 10 to 15 on submit (checkout-page.tsx). That is not a live format-as-you-type, and the error is not limited to after interaction. The sheet depends on RAD-053; phone checks do not need cities.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-2. A code read does not close a device or reference-match acceptance.
- **PR:** PR-2

### RAD-056 — بازنویسی متن‌های اطلاعات Checkout

- **Epic:** Checkout: آدرس و UX
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** عنوان، راهنما، placeholder، خطاها و متن آدرس و تماس با لحن RAD یکدست شوند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/components/checkout/const/checkout-copy.ts on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-14. A code read does not close a device or reference-match acceptance.
- **PR:** PR-14

### RAD-057 — ثابت ماندن استپر و موقعیت اسکرول

- **Epic:** Checkout: آدرس و UX
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** با رفتن به مرحله بعد، محتوای مرحله جدید از جای قابل مشاهده شروع شود و استپر در جای ثابت بماند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/components/checkout checkout stepper on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-14. A code read does not close a device or reference-match acceptance.
- **PR:** PR-14

### RAD-058 — بازنویسی عنوان مراحل پرداخت

- **Epic:** Checkout: آدرس و UX
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** نام و توضیح هر مرحله واضح و متناسب با پرداخت کارت/درگاه باشد.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/components/checkout/const/checkout-copy.ts on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-14. A code read does not close a device or reference-match acceptance.
- **PR:** PR-14

### RAD-059 — یکپارچه‌سازی شمارنده‌های Cart تا پرداخت

- **Epic:** Checkout: آدرس و UX
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** تعداد آیتم‌ها و مبلغ/وضعیت در cart، header، checkout و success با منبع حقیقت واحد باشند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Header, cart, and checkout counts share CartProvider. The header does not show the amount. Success-page amount parity with the order total was not re-read in this pass.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-4. A code read does not close a device or reference-match acceptance.
- **PR:** PR-4

### RAD-060 — «پیام به رَد» در Checkout و اتصال به ادمین

- **Epic:** Checkout: آدرس و UX
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** متن سفارش در Backend ذخیره و در ادمین دسته‌بندی و با اعلان قابل مشاهده باشد.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** No buyer-note field turned up on the order entity or checkout DTO. Admin order messages are a different thread.
- **Missing requirements:** متن سفارش در Backend ذخیره و در ادمین دسته‌بندی و با اعلان قابل مشاهده باشد.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-6. A code read does not close a device or reference-match acceptance.
- **PR:** PR-6

### RAD-061 — بازطراحی checkout-flow-action

- **Epic:** Checkout: آدرس و UX
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** CTA هر مرحله، هدف و گام بعد را شفاف نشان دهد؛ فاصله و فونت و سلسله‌مراتب اصلاح شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/components/checkout/checkout-payment/checkout-payment.tsx checkout-flow-action on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-14. A code read does not close a device or reference-match acceptance.
- **PR:** PR-14

### RAD-062 — پاک‌سازی خطای receipt هنگام برگشت

- **Epic:** Checkout: آدرس و UX
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** checkout-alert هنگام ترک مرحله/اصلاح ورودی به‌موقع پاک شود و خطای قدیمی باقی نماند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/components/checkout/checkout-payment/checkout-payment.tsx checkout-alert on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-14. A code read does not close a device or reference-match acceptance.
- **PR:** PR-14

### RAD-063 — رفع کپی شماره کارت

- **Epic:** Checkout: آدرس و UX
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** کپی شماره کارت در مرورگرهای پشتیبانی‌شده و موبایل کار کند؛ feedback موفق/ناموفق.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** payment-card.tsx on main copies card digits and amount and has copied and failed states (payment-card.spec.ts). It was not clicked in a mobile browser here.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-3. A code read does not close a device or reference-match acceptance.
- **PR:** PR-3

### RAD-064 — اصلاح رفتار «هنوز نه» در پرداخت

- **Epic:** Checkout: آدرس و UX
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** لغو/تعویق پرداخت به empty cart ناگهانی منجر نشود؛ وضعیت سفارش و سبد قابل پیش‌بینی باشد.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** هنوز نه is a link to /cart in checkout-payment.tsx. Checkout has already turned the cart into an order, so the cart can be empty while the order still holds the work.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** high
- **Tests:** `rad-test-matrix.md` section PR-1. A code read does not close a device or reference-match acceptance.
- **PR:** PR-1

### RAD-065 — حذف دکمه اضافه از کارت‌های carousel پایان Checkout

- **Epic:** Checkout: آدرس و UX
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** کارت‌های آثار موجود از کامپوننت درست و بدون CTA تکراری استفاده کنند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of checkout success carousel on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-14. A code read does not close a device or reference-match acceptance.
- **PR:** PR-14

### RAD-066 — پس‌زمینه کارت‌های انتخاب ایده

- **Epic:** سفارش اختصاصی: ثبت درخواست
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** idea-phase row مطابق تصویر مرجع با تم برند، responsive و خوانا.
- **Dependencies (as written):** none
- **Design reference:** تصویر ۳: Custom Order
- **Evidence:** Code inspection of apps/storefront/features/studio custom order idea step on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-15. A code read does not close a device or reference-match acceptance.
- **PR:** PR-15

### RAD-067 — تصاویر تازه بخش «عکس بفرست»

- **Epic:** سفارش اختصاصی: ثبت درخواست
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** تصاویر مرتبط و جذاب با حق استفاده مشخص، crop و alt مناسب.
- **Dependencies (as written):** none
- **Design reference:** تصویر ۳: Custom Order
- **Evidence:** Code inspection of apps/storefront/features/studio reference-image step on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-15. A code read does not close a device or reference-match acceptance.
- **PR:** PR-15

### RAD-068 — تصاویر دسته‌های «چی بسازیم؟»

- **Epic:** سفارش اختصاصی: ثبت درخواست
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** تصاویر واقعی/تصویری مرتبط برای هر نوع اثر، بدون گمراهی نسبت به قابلیت ساخت.
- **Dependencies (as written):** none
- **Design reference:** تصویر ۳: Custom Order
- **Evidence:** Code inspection of apps/storefront/public/studio category images on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-15. A code read does not close a device or reference-match acceptance.
- **PR:** PR-15

### RAD-069 — رفع scroll بعد از انتخاب اندازه

- **Epic:** سفارش اختصاصی: ثبت درخواست
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** مرحله رنگ بعد از انتخاب اندازه در viewport ظاهر شود؛ focus و scroll کنترل شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/studio size step on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-15. A code read does not close a device or reference-match acceptance.
- **PR:** PR-15

### RAD-070 — بازطراحی تصاویر میزان شباهت

- **Epic:** سفارش اختصاصی: ثبت درخواست
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** سه سطح شباهت با نمونه‌های قابل مقایسه و مرتبط نمایش داده شوند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/studio similarity step on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-15. A code read does not close a device or reference-match acceptance.
- **PR:** PR-15

### RAD-071 — رفع scroll مرحله بودجه

- **Epic:** سفارش اختصاصی: ثبت درخواست
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** پس از تغییر مرحله، سؤال بودجه در viewport قرار بگیرد.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/studio budget step on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-15. A code read does not close a device or reference-match acceptance.
- **PR:** PR-15

### RAD-072 — ریدیزاین موفقیت ثبت سفارش اختصاصی

- **Epic:** سفارش اختصاصی: ثبت درخواست
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** صفحه success با تصویر مناسب، شناسه درخواست و قدم بعدی واضح نمایش داده شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Success keeps sentId in localStorage (custom-designer.tsx). The success layout was not compared to a design.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-15. A code read does not close a device or reference-match acceptance.
- **PR:** PR-15

### RAD-073 — بازطراحی IA پیگیری سفارش و سفارش اختصاصی

- **Epic:** پروفایل: سفارش‌ها و ساخت
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** مسیرهای سفارش معمولی/اختصاصی و مراحل هر کدام ساده، قابل فهم و مستند شوند.
- **Dependencies (as written):** none
- **Design reference:** تصویر ۱: Order management
- **Evidence:** Code inspection of apps/storefront orders and making routes on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-16. A code read does not close a device or reference-match acceptance.
- **PR:** PR-16

### RAD-074 — طراحی مجدد تب‌های پروفایل

- **Epic:** پروفایل: سفارش‌ها و ساخت
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** تب‌ها از نظر ظاهر و accessibility مشخص و قابل تشخیص باشند.
- **Dependencies (as written):** RAD-070
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/components/account/account-shell/account-nav.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-16. A code read does not close a device or reference-match acceptance.
- **PR:** PR-16

### RAD-075 — تغییر محتوای تب بدون refresh و تغییر URL

- **Epic:** پروفایل: سفارش‌ها و ساخت
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** تعویض تب client-side و ثابت ماندن layout و URL طبق درخواست؛ back/focus بررسی شود.
- **Dependencies (as written):** RAD-071
- **Design reference:** none
- **Evidence:** Info, orders, making, and notifications are different URLs. The request is one stable URL.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-16. A code read does not close a device or reference-match acceptance.
- **PR:** PR-16

### RAD-076 — UX Writing تب Making

- **Epic:** پروفایل: سفارش‌ها و ساخت
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** اصطلاحات و مراحل ساخت به زبان ساده و یکدست بازنویسی شوند.
- **Dependencies (as written):** RAD-070
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/components/making on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-16. A code read does not close a device or reference-match acceptance.
- **PR:** PR-16

### RAD-077 — ریدیزاین اجزای تب Making

- **Epic:** پروفایل: سفارش‌ها و ساخت
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** هر بخش معنای روشن، وضعیت و اقدام بعدی داشته باشد؛ جزئیات گیج‌کننده حذف شوند.
- **Dependencies (as written):** RAD-070
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/components/making/customer-detail on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-16. A code read does not close a device or reference-match acceptance.
- **PR:** PR-16

### RAD-078 — نمایش swatch رنگ‌های انتخاب‌شده

- **Epic:** پروفایل: سفارش‌ها و ساخت
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** همان رنگ/نام انتخابی در فرم درخواست در Making نمایش داده شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/components/making/customer-detail/customer-brief.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-16. A code read does not close a device or reference-match acceptance.
- **PR:** PR-16

### RAD-079 — ترجمه «اجازه غافلگیری» به فارسی

- **Epic:** پروفایل: سفارش‌ها و ساخت
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** مقدار بولی/فنی به متن فارسی قابل فهم تبدیل شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** The label is Persian (اجازه غافلگیری) but commission.brief.permission is rendered raw in customer-brief.tsx.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-16. A code read does not close a device or reference-match acceptance.
- **PR:** PR-16

### RAD-080 — نمایش فایل عکس و صوت درخواست

- **Epic:** پروفایل: سفارش‌ها و ساخت
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** thumbnail و player/دانلود درست، خطای فایل و کنترل دسترسی رعایت شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** An audio element renders when brief.voice is set (customer-brief.tsx). Image thumbnail and file access control were not traced.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-16. A code read does not close a device or reference-match acceptance.
- **PR:** PR-16

### RAD-081 — نمایش شرطی اطلاعات مراحل Making

- **Epic:** پروفایل: سفارش‌ها و ساخت
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** بخش‌های خالی تا زمان رسیدن داده واقعی نمایش داده نشوند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/components/making/customer-detail/customer-brief.tsx on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-16. A code read does not close a device or reference-match acceptance.
- **PR:** PR-16

### RAD-082 — ریدیزاین کارت‌های تب Orders

- **Epic:** پروفایل: سفارش‌ها و ساخت
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** کارت‌ها وضعیت، شماره سفارش، زمان و اقدام اصلی را واضح نشان دهند.
- **Dependencies (as written):** RAD-070
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/components/orders on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-16. A code read does not close a device or reference-match acceptance.
- **PR:** PR-16

### RAD-083 — حذف کارت‌های اضافی از جزئیات سفارش

- **Epic:** پروفایل: سفارش‌ها و ساخت
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** track-card، track-address، order-next و order-help طبق درخواست حذف شوند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** order-detail.tsx still renders the address card, the next-action block, and the help block.
- **Missing requirements:** track-card، track-address، order-next و order-help طبق درخواست حذف شوند.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-10. A code read does not close a device or reference-match acceptance.
- **PR:** PR-10

### RAD-084 — شرط نمایش order-policies

- **Epic:** پروفایل: سفارش‌ها و ساخت
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** سیاست‌ها فقط برای سفارش موفق یا pending معتبر نمایش داده شوند؛ وضعیت‌های دیگر تست شوند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** OrderPolicies renders only when order.policyAcceptance is set. That is not the same rule as successful or valid pending.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-16. A code read does not close a device or reference-match acceptance.
- **PR:** PR-16

### RAD-085 — محدود کردن Notifications به پیام‌های هنرمند

- **Epic:** پروفایل: سفارش‌ها و ساخت
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** اعلان‌های بی‌اهمیت هر اکشن حذف؛ پیام هنرمند با خوانده‌شده/خوانده‌نشده نمایش داده شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Notice rows and the notifications page exist. They are not limited to artist messages.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-16. A code read does not close a device or reference-match acceptance.
- **PR:** PR-16

### RAD-086 — اتصال تب Info به مدیریت پروفایل و آدرس

- **Epic:** پروفایل: سفارش‌ها و ساخت
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** نمایش و ویرایش نام، ایمیل، شماره و آدرس‌های چندگانه از کامپوننت/داده مشترک.
- **Dependencies (as written):** RAD-014,RAD-015,RAD-017
- **Design reference:** none
- **Evidence:** Info shows name and email and cannot edit them. Blocked on RAD-014, RAD-015, and RAD-017.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-5. A code read does not close a device or reference-match acceptance.
- **PR:** PR-5

### RAD-087 — بازنگری هدف صفحه Help و ادغام احتمالی

- **Epic:** صفحات محتوایی و همکاری
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** نقش /help نسبت به FAQ/Contact مشخص؛ اگر تکراری است redirect و ادغام محتوا بدون شکستن لینک‌ها.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** /help and /contact both exist. No merge or redirect decision is recorded.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-17. A code read does not close a device or reference-match acceptance.
- **PR:** PR-17

### RAD-088 — UX Writing صفحه Help

- **Epic:** صفحات محتوایی و همکاری
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** در صورت حفظ صفحه، متن‌ها، ساختار، موارد تکراری و CTA اصلاح شوند.
- **Dependencies (as written):** RAD-084
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront help copy on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-17. A code read does not close a device or reference-match acceptance.
- **PR:** PR-17

### RAD-089 — اصلاح CTA صفحه About

- **Epic:** صفحات محتوایی و همکاری
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** «گفتگو با مهدیه» با متن دقیق‌تر جایگزین و به Contact هدایت شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** about/const/copy.ts still uses founderCta گفت‌وگو با مهدیه. The link already goes to /contact (about-page.tsx).
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-10. A code read does not close a device or reference-match acceptance.
- **PR:** PR-10

### RAD-090 — حذف padding افقی اضافی About

- **Epic:** صفحات محتوایی و همکاری
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** layout در breakpointها مطابق گرید مشترک باشد.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/components/about layout CSS on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-17. A code read does not close a device or reference-match acceptance.
- **PR:** PR-17

### RAD-091 — UX Writing صفحه About

- **Epic:** صفحات محتوایی و همکاری
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** متن‌ها با داستان برند و لحن کوتاه و صمیمی هماهنگ شوند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/components/about/const/copy.ts on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-17. A code read does not close a device or reference-match acceptance.
- **PR:** PR-17

### RAD-092 — یکسان‌سازی فونت‌های About

- **Epic:** صفحات محتوایی و همکاری
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** فونت، سایز و وزن با design system یکسان شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/components/about CSS on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-17. A code read does not close a device or reference-match acceptance.
- **PR:** PR-17

### RAD-093 — اصلاح alignment استپر Collaboration

- **Epic:** صفحات محتوایی و همکاری
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** استپر در RTL و اندازه‌های مختلف هم‌تراز باشد.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/collaboration on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-17. A code read does not close a device or reference-match acceptance.
- **PR:** PR-17

### RAD-094 — موشن استپر Collaboration

- **Epic:** صفحات محتوایی و همکاری
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** حرکت ظریف، بدون پرش و با reduced motion.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/collaboration stepper on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-17. A code read does not close a device or reference-match acceptance.
- **PR:** PR-17

### RAD-095 — UX Writing Collaboration

- **Epic:** صفحات محتوایی و همکاری
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** عنوان، راهنما، خطاها، مراحل و CTAها روشن و یکدست شوند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/collaboration copy on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-17. A code read does not close a device or reference-match acceptance.
- **PR:** PR-17

### RAD-096 — راست‌چین شدن placeholderهای Collaboration

- **Epic:** صفحات محتوایی و همکاری
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** placeholder و مقدار ورودی در فارسی و mixed text درست align شوند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/collaboration inputs on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-17. A code read does not close a device or reference-match acceptance.
- **PR:** PR-17

### RAD-097 — افزودن استان/شهر به Collaboration

- **Epic:** صفحات محتوایی و همکاری
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** انتخابگر وابسته استان/شهر از داده مشترک Checkout استفاده کند.
- **Dependencies (as written):** RAD-051,RAD-052
- **Design reference:** none
- **Evidence:** collaboration.tsx imports IRAN_CITIES, the same flat list as checkout, not a province-then-city pair.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-17. A code read does not close a device or reference-match acceptance.
- **PR:** PR-17

### RAD-098 — اصلاح UI/رفتار dropdownهای Collaboration

- **Epic:** صفحات محتوایی و همکاری
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** باز/بسته شدن، z-index، keyboard، scroll، focus و موبایل درست کار کند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/collaboration dropdowns on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-17. A code read does not close a device or reference-match acceptance.
- **PR:** PR-17

### RAD-099 — UX Writing صفحه Shape

- **Epic:** Shape، Passport و سایر صفحات
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** سؤال‌ها، گزینه‌ها، نتیجه و CTAها واضح و سازگار با برند شوند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/features/studio/shape-quiz on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-18. A code read does not close a device or reference-match acceptance.
- **PR:** PR-18

### RAD-100 — پیشنهاد سفارش اختصاصی در پایان Shape

- **Epic:** Shape، Passport و سایر صفحات
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** کنار آثار آماده CTA سفارش اختصاصی متناسب با نتیجه دیده شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** quiz-result links archive works. No custom-order CTA was found beside the result.
- **Missing requirements:** کنار آثار آماده CTA سفارش اختصاصی متناسب با نتیجه دیده شود.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-10. A code read does not close a device or reference-match acceptance.
- **PR:** PR-10

### RAD-101 — حذف پیشنهادهای محصول غیرواقعی Shape

- **Epic:** Shape، Passport و سایر صفحات
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** فقط محصولات واقعی و عکس‌های درست از منبع داده معتبر نمایش داده شوند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** use-shape-matches.ts ranks passports built from catalog artworks and joins getArtwork. This audit did not render the three cards.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-18. A code read does not close a device or reference-match acceptance.
- **PR:** PR-18

### RAD-102 — حفظ وضعیت آزمون Shape هنگام برگشت

- **Epic:** Shape، Passport و سایر صفحات
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Missing
- **Acceptance criteria:** پاسخ‌ها با بازگشت از PDP حفظ شوند؛ فقط reset دستی پاک کند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Quiz answers live in component state. No localStorage or URL persistence was found under shape-quiz/.
- **Missing requirements:** پاسخ‌ها با بازگشت از PDP حفظ شوند؛ فقط reset دستی پاک کند.
- **Frontend:** Implement the acceptance criteria on the storefront or admin surface named in the evidence.
- **Backend / database:** Add an API or migration only when the evidence says the data is absent. PR-5, PR-7, and PR-8 are the migration PRs.
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-10. A code read does not close a device or reference-match acceptance.
- **PR:** PR-10

### RAD-103 — یکسان‌سازی مقصد کارت‌های Shape

- **Epic:** Shape، Passport و سایر صفحات
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** تمام آثار پیشنهادی به PDP مناسب بروند، نه ترکیبی از passport و PDP.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** result-card.tsx links to /passport/{code}, not the PDP.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-10. A code read does not close a device or reference-match acceptance.
- **PR:** PR-10

### RAD-104 — UX Writing صفحه Passport

- **Epic:** Shape، Passport و سایر صفحات
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** متن شماره اختصاصی، شناسنامه، اصالت و توضیحات قابل فهم و دقیق باشند.
- **Dependencies (as written):** RAD-030
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/components/passport on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-18. A code read does not close a device or reference-match acceptance.
- **PR:** PR-18

### RAD-105 — هماهنگی دکمه‌های صفحه Review

- **Epic:** Shape، Passport و سایر صفحات
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** شکل، اندازه، وضعیت و ترتیب دکمه‌ها در موبایل و دسکتاپ یکسان شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront reviews page on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-18. A code read does not close a device or reference-match acceptance.
- **PR:** PR-18

### RAD-106 — UX Writing صفحه Difference

- **Epic:** Shape، Passport و سایر صفحات
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** عنوان‌ها، متن‌ها و CTAها بازبینی شوند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/components/difference on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-18. A code read does not close a device or reference-match acceptance.
- **PR:** PR-18

### RAD-107 — UX Writing جزئیات Difference

- **Epic:** Shape، Passport و سایر صفحات
- **Sheet priority:** P2
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** متن صفحه جزئیات، پیام‌ها و CTAها بازبینی شوند.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of apps/storefront/app/[locale]/differences/[id] on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-18. A code read does not close a device or reference-match acceptance.
- **PR:** PR-18

### RAD-108 — تست end-to-end مسیر خرید و پرداخت

- **Epic:** کیفیت و انتشار
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** از PDP تا Cart و Checkout و بازگشت از پرداخت، سناریوهای موفق/ناموفق/لغو با داده تست پوشش داده شوند.
- **Dependencies (as written):** RAD-038,RAD-058,RAD-061,RAD-064
- **Design reference:** none
- **Evidence:** npm run test:purchase covers API checkout, receipt, expiry, and cancel (purchase-flow.spec.ts). There is no browser runner from the PDP through the payment return.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** high
- **Tests:** `rad-test-matrix.md` section PR-21. A code read does not close a device or reference-match acceptance.
- **PR:** PR-21

### RAD-109 — تست دسترسی، RTL و موبایل روی جریان‌های اصلی

- **Epic:** کیفیت و انتشار
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** موبایل iOS/Android و دسکتاپ؛ keyboard، focus، aria، contrast و RTL بررسی شود.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of .github/workflows/ci.yml has no browser job on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** medium
- **Tests:** `rad-test-matrix.md` section PR-21. A code read does not close a device or reference-match acceptance.
- **PR:** PR-21

### RAD-110 — تست migration، rollback و امنیت داده

- **Epic:** کیفیت و انتشار
- **Sheet priority:** P0
- **Sheet status:** انجام‌نشده
- **Audit status:** Partial
- **Acceptance criteria:** برای تغییرات DB/Auth/Order قبل از انتشار سناریوی rollback و عدم از دست رفتن داده بررسی شود.
- **Dependencies (as written):** RAD-006,RAD-012,RAD-014
- **Design reference:** none
- **Evidence:** CI includes release-policy and rollback fixture jobs (.github/workflows/ci.yml). Those jobs do not rehearse category or profile migrations, which do not exist yet.
- **Missing requirements:** The gap named in the evidence. The part already present stays.
- **Frontend:** Change only the unmet part.
- **Backend / database:** Only if the evidence names a server or schema gap.
- **Regression risk:** high
- **Tests:** `rad-test-matrix.md` section PR-21. A code read does not close a device or reference-match acceptance.
- **PR:** PR-21

### RAD-111 — بازبینی نهایی UI با تصاویر مرجع

- **Epic:** کیفیت و انتشار
- **Sheet priority:** P1
- **Sheet status:** انجام‌نشده
- **Audit status:** Needs Verification
- **Acceptance criteria:** مقایسه before/after و بررسی سازگاری با ساختار فعلی سایت، نه کپی کورکورانه طرح‌ها.
- **Dependencies (as written):** none
- **Design reference:** none
- **Evidence:** Code inspection of docs/RAD_Complete_Task_Backlog.xlsx names images that are not in the repo on origin/main. The acceptance is visual, copy quality, or runtime behavior. This audit did not open a browser. If the row names a design reference, that image is not in the repository, so a match was not judged.
- **Missing requirements:** Unconfirmed. Do not change the UI until a render or the reference image shows a gap.
- **Frontend:** None until that evidence exists.
- **Backend / database:** none
- **Regression risk:** low
- **Tests:** `rad-test-matrix.md` section PR-21. A code read does not close a device or reference-match acceptance.
- **PR:** PR-21
