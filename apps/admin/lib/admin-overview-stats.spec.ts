import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { OverviewStats } from "../components/admin-overview-stats";

test("OverviewStats preserves status counts and total", () => {
  const products = [
    { status: "available" },
    { status: "available" },
    { status: "in_workshop" },
    { status: "sold" },
    { status: "reserved" },
  ] as Parameters<typeof OverviewStats>[0]["products"];
  const html = renderToStaticMarkup(
    createElement(OverviewStats, { products, loading: false }),
  );
  assert.match(html, /آماده فروش/);
  assert.match(html, /در کارگاه/);
  assert.match(html, /فروخته شده/);
  assert.match(html, /اثر ثبت‌شده/);
  assert.equal((html.match(/>۲<\/strong>/g) ?? []).length, 1);
  assert.equal((html.match(/>۱<\/strong>/g) ?? []).length, 2);
  assert.equal((html.match(/>۵<\/strong>/g) ?? []).length, 1);
});

test("OverviewStats shows skeletons before initial product load", () => {
  const html = renderToStaticMarkup(
    createElement(OverviewStats, { products: [], loading: true }),
  );
  assert.equal((html.match(/class="stat-skeleton"/g) ?? []).length, 4);
});
