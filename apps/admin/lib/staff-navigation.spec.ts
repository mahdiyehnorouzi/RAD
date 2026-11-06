import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  initialDashboardSection,
  isReviewsPath,
  sectionDataTarget,
  staffGate,
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

test("session restore stays on the loading gate, and a failed restore is not the login screen", () => {
  assert.equal(staffGate("initializing", false), "loading");
  assert.equal(staffGate("error", true), "error");
  assert.equal(staffGate("unauthenticated", false), "login");
  assert.equal(staffGate("authenticated", false), "login");
  assert.equal(staffGate("authenticated", true), "app");
});
