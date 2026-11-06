import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  initialDashboardSection,
  isReviewsPath,
  planHistoryNavigation,
  planSectionSelect,
  sectionDataTarget,
  staffGate,
  type StudioView,
} from "./staff-navigation";

test("reviews is a path, and a commissions hash still opens that section on /", () => {
  assert.equal(isReviewsPath("/reviews"), true);
  assert.equal(isReviewsPath("/reviews/"), true);
  assert.equal(isReviewsPath("/"), false);
  assert.equal(isReviewsPath("/reset-password"), false);

  assert.equal(initialDashboardSection(""), "overview");
  assert.equal(initialDashboardSection("#commissions/c1"), "commissions");
  assert.equal(initialDashboardSection("#reviews"), "overview");
});

test("direct /reviews loads reviews and does not let a stale hash replace it", () => {
  assert.equal(sectionDataTarget("/reviews", "overview"), "reviews");
  assert.equal(sectionDataTarget("/reviews", "commissions"), "reviews");
  assert.equal(sectionDataTarget("/", "overview"), "overview");
  assert.equal(sectionDataTarget("/", "orders"), "orders");
  assert.equal(
    sectionDataTarget("/", initialDashboardSection("#commissions/c1")),
    "commissions",
  );
});

test("the studio shell owns the one workspace hook for / and /reviews", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const read = (relative: string) => readFileSync(join(root, relative), "utf8");
  const calls = (source: string) =>
    source.match(/useAdminWorkspace\(/g)?.length ?? 0;
  assert.equal(calls(read("components/admin-shell.tsx")), 1);
  assert.equal(calls(read("components/admin-dashboard.tsx")), 0);
  assert.equal(calls(read("features/reviews/reviews-page.tsx")), 0);
  assert.match(read("components/admin-shell.tsx"), /href="\/reviews"/);
  assert.match(read("app/(studio)/reviews/page.tsx"), /ReviewsPage/);
  assert.doesNotMatch(read("components/admin-dashboard.tsx"), /AdminReviews/);
});

test("explicit section choices replace memory, and history back restores it", () => {
  const overview: StudioView = { pathname: "/", section: "overview" };
  const toReviews = planSectionSelect(overview, "reviews");
  assert.deepEqual(toReviews, {
    view: { pathname: "/reviews", section: "overview" },
    load: "reviews",
  });

  const orders: StudioView = { pathname: "/", section: "orders" };
  const ordersToReviews = planSectionSelect(orders, "reviews");
  assert.equal(ordersToReviews.view.section, "orders");
  assert.equal(ordersToReviews.load, "reviews");
  const backToOrders = planHistoryNavigation(ordersToReviews.view, "/");
  assert.deepEqual(backToOrders, {
    view: { pathname: "/", section: "orders" },
    load: "orders",
  });
  const forwardToReviews = planHistoryNavigation(backToOrders.view, "/reviews");
  assert.deepEqual(forwardToReviews, {
    view: { pathname: "/reviews", section: "orders" },
    load: "reviews",
  });

  const chooseOverview = planSectionSelect(ordersToReviews.view, "overview");
  assert.deepEqual(chooseOverview.view, { pathname: "/", section: "overview" });
  assert.equal(chooseOverview.load, "overview");
  const chooseOrders = planSectionSelect(ordersToReviews.view, "orders");
  assert.deepEqual(chooseOrders.view, { pathname: "/", section: "orders" });
  assert.equal(chooseOrders.load, "orders");
  const chooseMessages = planSectionSelect(ordersToReviews.view, "messages");
  assert.deepEqual(chooseMessages.view, { pathname: "/", section: "messages" });
  assert.equal(chooseMessages.load, "messages");

  assert.equal(planSectionSelect(overview, "overview").load, null);
  assert.equal(planSectionSelect(toReviews.view, "reviews").load, null);
  assert.equal(planHistoryNavigation(toReviews.view, "/reviews").load, null);
});

test("a commissions hash is read on mount and does not retarget the shell later", () => {
  assert.equal(initialDashboardSection("#commissions/RAD-M-1"), "commissions");
  assert.equal(initialDashboardSection("#commissions/"), "commissions");
  const mounted: StudioView = { pathname: "/", section: "commissions" };
  const toReviews = planSectionSelect(mounted, "reviews");
  const back = planHistoryNavigation(toReviews.view, "/");
  assert.equal(back.view.section, "commissions");
  assert.equal(back.load, "commissions");

  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const shell = readFileSync(join(root, "components/admin-shell.tsx"), "utf8");
  const commissions = readFileSync(
    join(root, "components/admin-commissions.tsx"),
    "utf8",
  );
  assert.doesNotMatch(shell, /hashchange/);
  assert.match(shell, /initialDashboardSection\(/);
  assert.match(commissions, /window\.addEventListener\("popstate"/);
  assert.match(commissions, /#commissions\//);
  assert.match(commissions, /window\.history\.pushState/);
});

test("reviews wiring keeps permission, mutation, failure, and success copy", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const page = readFileSync(
    join(root, "features/reviews/reviews-page.tsx"),
    "utf8",
  );
  const panel = readFileSync(
    join(root, "features/reviews/admin-reviews.tsx"),
    "utf8",
  );
  assert.match(page, /workspace\.can\("content\.write"\)/);
  assert.match(page, /workspace\.setReviewHidden\(id, hidden\)/);
  assert.match(page, /workspace\.deleteReview\(id\)/);
  assert.match(page, /نظر از فروشگاه پنهان شد/);
  assert.match(page, /نظر دوباره در فروشگاه دیده می‌شود/);
  assert.match(page, /نظر حذف شد/);
  assert.match(panel, /تغییر نمایش نظر ناموفق بود/);
  assert.match(panel, /await onDelete\(deleteTarget\.id\)/);
  assert.match(panel, /حذف نظر /);
});

test("the shell gates session restore and logs out through the one workspace", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const shell = readFileSync(join(root, "components/admin-shell.tsx"), "utf8");
  assert.match(shell, /staffGate\(/);
  assert.match(shell, /workspace\.retryAuth\(\)/);
  assert.match(shell, /workspace\.logout\(\)/);
  assert.match(shell, /planSectionSelect\(/);
  assert.equal(shell.match(/useAdminWorkspace\(/g)?.length ?? 0, 1);
});

test("session restore stays on the loading gate, and a failed restore is not the login screen", () => {
  assert.equal(staffGate("initializing", false), "loading");
  assert.equal(staffGate("error", true), "error");
  assert.equal(staffGate("unauthenticated", false), "login");
  assert.equal(staffGate("authenticated", false), "login");
  assert.equal(staffGate("authenticated", true), "app");
});
