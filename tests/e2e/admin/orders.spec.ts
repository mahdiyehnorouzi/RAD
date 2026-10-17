/**
 * P1 — Admin order management: payment review UI.
 *
 * Selectors read from apps/admin/components/admin-order-payment.tsx: the
 * "تأیید پرداخت" / "رد پرداخت" buttons only render when
 * `reviewable = order.status === "pending_verification" && canWrite`
 * (admin-order-payment.tsx comment, mirrors backend's
 * PaymentReviewService.lockForReview re-check per docs/qa/flow-inventory.md
 * section 6 — UI gating is belt-and-suspenders, not the real enforcement).
 *
 * Admin auth: no admin seed user was found in apps/api/seed/*.ts during
 * this task's investigation. This spec logs in through the admin app's own
 * session (reusing tests/helpers/admin-auth.ts's API login and injecting
 * the resulting cookie into the browser context) rather than scripting an
 * admin login FORM whose DOM wasn't located in this pass. Requires
 * E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD env vars.
 *
 * WRITTEN BUT BLOCKED in this sandbox: no running apps/admin (:3002) /
 * apps/api (:4000) / Postgres, no admin credentials, and no Chromium
 * binary (playwright install blocked by a 403 in this sandbox). See
 * tests/e2e/automation-strategy.md.
 */
import { test, expect } from "@playwright/test";
import { newApiContext } from "../../fixtures/api";
import { loginAsAdmin } from "../../helpers/admin-auth";

test("admin can see the orders list and a pending_verification order is reviewable", async ({
  page,
}) => {
  const api = await newApiContext();
  await loginAsAdmin(api);
  const state = await api.storageState();
  await page.context().addCookies(state.cookies);

  await page.goto("/");
  // admin-dashboard.tsx is the entry component; assert the page actually
  // rendered an authenticated admin shell, not a login redirect/blank page.
  await expect(page.locator(".admin-nav")).toBeVisible({ timeout: 15_000 });

  // Navigate to an order with status pending_verification, if one exists.
  const pendingRow = page.getByText("در انتظار تأیید").first();
  const hasPending = await pendingRow.isVisible().catch(() => false);
  test.skip(
    !hasPending,
    "No pending_verification order currently in the admin list — depends on live DB state.",
  );
  await pendingRow.click();

  await expect(page.getByRole("button", { name: /تأیید پرداخت/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /رد پرداخت/ })).toBeVisible();

  await api.dispose();
});
