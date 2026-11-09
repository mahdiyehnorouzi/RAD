import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PDP_ASSURANCES } from "./const/pdp-assurances";
import { pdpCopy } from "./const/pdp-copy";
import {
  ARTWORK_SPEC_FACT_KEYS,
  SOLD_STATUS_FA,
  editionIdentity,
  makingProcessText,
  titleIdentityLine,
} from "./pdp-content";

test("the sold state uses the approved sentence and not the long note", () => {
  assert.equal(pdpCopy.fa.soldFoundNote, SOLD_STATUS_FA);
  assert.equal("soldNote" in pdpCopy.fa, false);
  assert.equal("soldNote" in pdpCopy.en, false);
  assert.equal(JSON.stringify(pdpCopy).includes("نسخه‌ی دیگه‌ای"), false);
});

test("the title keeps the archive number and the edition keeps 1/1", () => {
  assert.equal(titleIdentityLine("RĀD / ۰۸۲"), "RĀD / ۰۸۲");
  assert.equal(titleIdentityLine(null), null);
  assert.deepEqual(editionIdentity("RĀD / ۰۸۲", pdpCopy.fa.oneOfOne), [
    "RĀD / ۰۸۲",
    "۱ / ۱",
  ]);
  assert.equal(editionIdentity(null, pdpCopy.fa.oneOfOne), null);
});

test("assurances stay short and use the published shipping and return facts", () => {
  const text = PDP_ASSURANCES.flatMap((item) => [
    item.title.fa,
    item.title.en,
    item.detail.fa,
    item.detail.en,
  ]).join("\n");
  assert.equal(text.includes("امن"), false);
  assert.equal(/safe shipping/i.test(text), false);
  assert.equal(text.includes("بیمه‌شده در ایران"), true);
  assert.equal(text.includes("Insured in Iran"), true);
  assert.equal(text.includes("۴۸ ساعت"), true);
  assert.equal(text.includes("فقط یک نسخه"), true);
});

test("specifications list materials and size, not the making process", () => {
  assert.deepEqual(ARTWORK_SPEC_FACT_KEYS, ["material", "surface", "size"]);
  assert.equal(
    (ARTWORK_SPEC_FACT_KEYS as readonly string[]).includes("process"),
    false,
  );
});

test("making keeps a work's process text when specifications no longer show it", () => {
  const process = { fa: "  ساخت دستی  ", en: "Hand built" };
  assert.equal(makingProcessText(process, "fa"), "ساخت دستی");
  assert.equal(makingProcessText(process, "en"), "Hand built");
  assert.equal(makingProcessText({ fa: "  ", en: "" }, "fa"), undefined);
  assert.equal(makingProcessText(undefined, "fa"), undefined);
});

test("related-works clearance uses the floating-bar footprint, not an extra band", () => {
  const css = readFileSync(
    new URL("./product-detail.module.css", import.meta.url),
    "utf8",
  );
  assert.match(
    css,
    /padding:[\s\S]*calc\(var\(--page\) \+ 4\.75rem \+ env\(safe-area-inset-bottom, 0px\)\)/,
  );
  const padding = css.slice(
    css.indexOf("padding:"),
    css.indexOf("background:"),
  );
  assert.equal(padding.includes("6rem"), false);
});

test("care icons occupy the start column so RTL places them right of the text", () => {
  const css = readFileSync(
    new URL("./product-care.module.css", import.meta.url),
    "utf8",
  );
  assert.match(css, /grid-template-areas:\s*"icon text"/);
  assert.match(css, /grid-area:\s*icon/);
  assert.match(css, /grid-area:\s*text/);
});
