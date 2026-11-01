import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StatTile } from "../components/admin-stat-tile";

test("StatTile renders Persian numbers, label and icon", () => {
  const html = renderToStaticMarkup(
    createElement(StatTile, {
      icon: createElement("i", null, "icon"),
      value: 1234,
      label: "آماده فروش",
    }),
  );
  assert.match(html, /class="stat-tile"/);
  assert.match(html, /۱٬۲۳۴/);
  assert.match(html, /آماده فروش/);
  assert.match(html, /icon/);
});

test("StatTile loading replaces its value with an accessible skeleton", () => {
  const html = renderToStaticMarkup(
    createElement(StatTile, {
      icon: createElement("i", null, "icon"),
      value: 1234,
      label: "آماده فروش",
      loading: true,
    }),
  );
  assert.match(html, /class="stat-skeleton"/);
  assert.match(html, /aria-hidden="true"/);
  assert.doesNotMatch(html, /۱٬۲۳۴/);
  assert.match(html, /آماده فروش/);
});
