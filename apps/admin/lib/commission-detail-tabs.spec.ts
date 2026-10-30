import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import {
  commissionDetailTabs,
  defaultCommissionDetailTab,
} from "./commission-detail-tabs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("permitted Custom Order tabs always include summary, files, messages, and history", () => {
  const tabs = commissionDetailTabs({
    stage: "in_production",
    nextActor: "studio",
  });
  assert.deepEqual(
    tabs.map((tab) => tab.id),
    ["summary", "files", "messages", "history"],
  );
  assert.deepEqual(
    tabs.map((tab) => tab.label),
    ["خلاصه", "فایل‌ها", "پیام‌ها", "تاریخچه مراحل"],
  );
});

test("the decision tab is added only for the existing review gate, not every stage", () => {
  assert.ok(
    commissionDetailTabs({
      stage: "design_submitted",
      nextActor: "artist",
    }).some((tab) => tab.id === "decision"),
  );
  assert.ok(
    commissionDetailTabs({
      stage: "feasibility",
      nextActor: "artist",
    }).some((tab) => tab.id === "decision"),
  );
  assert.ok(
    !commissionDetailTabs({
      stage: "feasibility",
      nextActor: "customer",
    }).some((tab) => tab.id === "decision"),
  );
  assert.equal(
    defaultCommissionDetailTab({
      stage: "design_submitted",
      nextActor: "artist",
    }),
    "decision",
  );
  assert.equal(
    defaultCommissionDetailTab({
      stage: "in_production",
      nextActor: "studio",
    }),
    "summary",
  );
});

test("the detail view renders the tablist between StageMeter and the summary pane", () => {
  const source = readFileSync(
    join(root, "components/admin-commissions.tsx"),
    "utf8",
  );
  const detail = source.slice(source.indexOf("function CommissionDetail"));
  const stage = detail.indexOf("<StageMeter");
  const tabs = detail.indexOf('className="commission-tabs"');
  const summary = detail.indexOf('className="commission-summary"');
  assert.ok(stage > 0, "expected StageMeter in the detail view");
  assert.ok(tabs > stage, "tablist must come after StageMeter, not before it");
  assert.ok(
    summary > tabs,
    "summary facts must come after the tablist so they cannot replace it",
  );
  assert.match(detail, /role="tablist"/);
  assert.match(detail, /commissionDetailTabs\(/);
});

test("mobile CSS keeps the tab strip a real scrollport instead of clipping it on the page", () => {
  const css = readFileSync(join(root, "app/globals.css"), "utf8");
  assert.doesNotMatch(
    css,
    /\.commission-tabs[^{]*\{[^}]*display:\s*none/,
    "tabs must not be display:none",
  );
  assert.match(
    css,
    /\.commission-detail[\s\S]{0,280}overflow-x:\s*hidden/,
    "the fixed mobile detail pane must not become a horizontal scroller that hides the tab row",
  );
  assert.match(
    css,
    /\.commission-tabs[\s\S]{0,400}min-height:\s*44px/,
    "Safari collapses overflow-x flex rows without an explicit min-height",
  );
  assert.match(css, /\.commission-tabs[\s\S]{0,400}overflow-x:\s*auto/);
});
