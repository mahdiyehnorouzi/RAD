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
  assert.equal((html.match(/class="stat-tile"/g) ?? []).length, 4);
  assert.match(html, /<strong>۲<\/strong><span>آماده فروش<\/span>/);
  assert.match(html, /<strong>۱<\/strong><span>در کارگاه<\/span>/);
  assert.match(html, /<strong>۱<\/strong><span>فروخته شده<\/span>/);
  assert.match(html, /<strong>۵<\/strong><span>اثر ثبت‌شده<\/span>/);
});

test("OverviewStats shows skeletons before initial product load", () => {
  const html = renderToStaticMarkup(
    createElement(OverviewStats, { products: [], loading: true }),
  );
  assert.equal((html.match(/class="stat-skeleton"/g) ?? []).length, 4);
});
