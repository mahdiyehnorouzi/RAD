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
  sectionForCommittedPath,
  settleStudioPath,
  staffGate,
  startReviewsLink,
  startSectionSelect,
  studioHistoryHref,
  type PendingNavigation,
  type StudioAuth,
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
  assert.match(shell, /startSectionSelect\(/);
  assert.match(shell, /startReviewsLink\(/);
  assert.match(shell, /settleStudioPath\(/);
  assert.match(shell, /addEventListener\("popstate"/);
  assert.equal(shell.match(/useAdminWorkspace\(/g)?.length ?? 0, 1);
});

type RaceShell = {
  auth: StudioAuth;
  pathname: string;
  section: StudioView["section"];
  /** Section a click handler can read before the next render. */
  sectionNow: StudioView["section"];
  /** Pathname and section from the last render. A second click in the same turn still sees these. */
  renderedPath: string;
  renderedSection: StudioView["section"];
  seen: string | null;
  skip: StudioView["section"] | null;
  pending: PendingNavigation | null;
  inFlight: string | null;
  loaded: StudioView["section"][];
};

function remember(shell: RaceShell, load: StudioView["section"] | null) {
  if (load && !shell.loaded.includes(load)) shell.loaded.push(load);
}

function paint(shell: RaceShell) {
  const committed = sectionForCommittedPath(
    shell.pathname,
    shell.section,
    shell.pending,
  );
  shell.section = committed;
  shell.sectionNow = committed;
  shell.renderedPath = shell.pathname;
  shell.renderedSection = committed;
}

function settle(shell: RaceShell) {
  const settled = settleStudioPath({
    auth: shell.auth,
    pathname: shell.pathname,
    section: shell.section,
    seen: shell.seen,
    skip: shell.skip,
    pending: shell.pending,
  });
  shell.seen = settled.seen;
  shell.skip = settled.skip;
  shell.pending = settled.pending;
  shell.section = settled.section;
  shell.sectionNow = settled.section;
  remember(shell, settled.load);
}

function boot(pathname: string, section: StudioView["section"]): RaceShell {
  const shell: RaceShell = {
    auth: "initializing",
    pathname,
    section,
    sectionNow: section,
    renderedPath: pathname,
    renderedSection: section,
    seen: null,
    skip: null,
    pending: null,
    inFlight: null,
    loaded: [],
  };
  settle(shell);
  shell.auth = "authenticated";
  settle(shell);
  return shell;
}

function select(shell: RaceShell, next: StudioView["section"]) {
  const action = startSectionSelect(
    { pathname: shell.renderedPath, section: shell.renderedSection },
    shell.pending,
    next,
  );
  shell.pending = action.pending;
  shell.skip = action.skip;
  shell.section = action.section;
  shell.sectionNow = action.section;
  remember(shell, action.load);
  if (action.push) shell.inFlight = action.push;
  else if (action.replace) shell.inFlight = action.replace;
}

function openReviews(shell: RaceShell) {
  const action = startReviewsLink({
    pathname: shell.renderedPath,
    section: shell.sectionNow,
  });
  shell.pending = action.pending;
  shell.skip = action.skip;
  shell.inFlight = "/reviews";
}

function commit(shell: RaceShell) {
  if (!shell.inFlight || shell.inFlight === shell.pathname) {
    shell.inFlight = null;
    return;
  }
  shell.pathname = shell.inFlight;
  shell.inFlight = null;
  paint(shell);
  settle(shell);
}

function pop(shell: RaceShell, pathname: string) {
  shell.inFlight = null;
  shell.pending = null;
  shell.skip = null;
  shell.pathname = pathname;
  paint(shell);
  settle(shell);
}

function setAuth(shell: RaceShell, auth: StudioAuth) {
  shell.auth = auth;
  if (auth === "unauthenticated") shell.loaded = [];
  settle(shell);
}

function visible(shell: RaceShell) {
  return sectionDataTarget(shell.pathname, shell.section);
}

test("navigation races still load the section that remains on screen", () => {
  const rapid = boot("/", "overview");
  openReviews(rapid);
  paint(rapid);
  select(rapid, "orders");
  paint(rapid);
  openReviews(rapid);
  commit(rapid);
  assert.equal(rapid.pathname, "/reviews");
  assert.equal(rapid.section, "orders");
  assert.ok(rapid.loaded.includes("reviews"));

  const burst = boot("/reviews", "overview");
  select(burst, "orders");
  select(burst, "messages");
  commit(burst);
  assert.equal(burst.pathname, "/");
  assert.equal(burst.section, "messages");
  assert.equal(visible(burst), "messages");
  assert.ok(burst.loaded.includes("messages"));

  const cancelled = boot("/reviews", "overview");
  select(cancelled, "orders");
  pop(cancelled, "/");
  assert.equal(cancelled.pathname, "/");
  assert.equal(cancelled.section, "overview");
  assert.equal(visible(cancelled), "overview");
  assert.ok(cancelled.loaded.includes("overview"));

  const signedOut = boot("/reviews", "overview");
  select(signedOut, "orders");
  setAuth(signedOut, "unauthenticated");
  commit(signedOut);
  setAuth(signedOut, "authenticated");
  assert.equal(visible(signedOut), signedOut.section);
  assert.ok(signedOut.loaded.includes(visible(signedOut)));

  const restored = settleStudioPath({
    auth: "authenticated",
    pathname: "/",
    section: "orders",
    seen: "/reviews",
    skip: null,
    pending: null,
  });
  assert.equal(restored.load, "orders");

  const reloaded = boot("/reviews", "overview");
  select(reloaded, "overview");
  commit(reloaded);
  assert.equal(reloaded.pathname, "/");
  assert.equal(reloaded.section, "overview");
  assert.ok(reloaded.loaded.includes("overview"));

  const hashed = boot("/", "commissions");
  assert.ok(hashed.loaded.includes("commissions"));
  openReviews(hashed);
  commit(hashed);
  pop(hashed, "/");
  assert.equal(hashed.section, "commissions");
  assert.ok(hashed.loaded.includes("commissions"));
  const leaveHash = startSectionSelect(
    { pathname: "/", section: "commissions" },
    null,
    "overview",
  );
  assert.equal(leaveHash.push, null);
  assert.equal(leaveHash.replace, null);
  assert.equal(
    studioHistoryHref("/", "#commissions/RAD-M-1"),
    "/#commissions/RAD-M-1",
  );
  assert.equal(
    studioHistoryHref("/reviews", "#commissions/RAD-M-1"),
    "/reviews",
  );
});

test("session restore stays on the loading gate, and a failed restore is not the login screen", () => {
  assert.equal(staffGate("initializing", false), "loading");
  assert.equal(staffGate("error", true), "error");
  assert.equal(staffGate("unauthenticated", false), "login");
  assert.equal(staffGate("authenticated", false), "login");
  assert.equal(staffGate("authenticated", true), "app");
});
