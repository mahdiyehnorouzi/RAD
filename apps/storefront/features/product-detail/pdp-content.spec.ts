import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PDP_ASSURANCES } from "./const/pdp-assurances";
import { purchasePathCopy } from "../../components/help/const/purchase-path-copy";
import { specAttributeIconName } from "./spec-icons";
import { pdpCopy } from "./const/pdp-copy";
import {
  ARTWORK_SPEC_FACT_KEYS,
  SOLD_STATUS_FA,
  editionIdentity,
  isArtworkDescriptionCopy,
  titleIdentityLine,
} from "./pdp-content";

test("the sold state uses the approved sentence and not the long note", () => {
  assert.equal(pdpCopy.fa.soldFoundNote, SOLD_STATUS_FA);
  assert.equal("soldNote" in pdpCopy.fa, false);
  assert.equal("soldNote" in pdpCopy.en, false);
  assert.equal(JSON.stringify(pdpCopy).includes("نسخه‌ی دیگه‌ای"), false);
});

test("the title and the archive number keep the identifier and leave 1/1 off", () => {
  assert.equal(titleIdentityLine("RĀD / ۰۸۲"), "RĀD / ۰۸۲");
  assert.equal(titleIdentityLine(null), null);
  assert.equal(editionIdentity("RĀD / ۰۸۲"), "RĀD / ۰۸۲");
  assert.equal(editionIdentity("  "), null);
  assert.equal(editionIdentity(null), null);
  assert.equal(editionIdentity("RĀD / ۰۸۲")?.includes("۱"), false);
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
  assert.equal(text.includes("رایگان"), false);
  assert.equal(/free/i.test(text), false);
  assert.equal(text.includes("تهران پست یا پیک"), true);
  assert.equal(text.includes("other cities by post"), true);
  assert.equal(text.includes("۴۸ ساعت"), true);
  assert.equal(text.includes("فقط یک نسخه"), true);
  const method = purchasePathCopy.fa.disclosureTeaser;
  assert.equal(method.includes("رایگان"), false);
  assert.equal(method.includes("پست یا پیک"), true);
  assert.equal(method.includes("شهرهای دیگر با پست"), true);
  assert.equal(purchasePathCopy.en.disclosureTeaser.includes("Free"), false);
  assert.match(purchasePathCopy.en.disclosureTeaser, /post or courier/);
});

test("specifications list materials and size, not the making process", () => {
  assert.deepEqual(ARTWORK_SPEC_FACT_KEYS, ["material", "surface", "size"]);
  assert.equal(
    (ARTWORK_SPEC_FACT_KEYS as readonly string[]).includes("process"),
    false,
  );
});

test("artwork details omit description prose and the making section is gone", () => {
  const description = "ارغوان | یه ظرف با سلیقه‌ی خودش!";
  const story = `${description}\n\nارغوان از اون ظرف‌هاست.`;
  assert.equal(isArtworkDescriptionCopy(description, description, story), true);
  assert.equal(
    isArtworkDescriptionCopy(`${description} و ادامه`, description, story),
    true,
  );
  assert.equal(isArtworkDescriptionCopy(story, description, story), true);
  assert.equal(
    isArtworkDescriptionCopy("سرامیک لعاب‌دار", description, story),
    false,
  );
  const detail = readFileSync(
    new URL("./product-detail.tsx", import.meta.url),
    "utf8",
  );
  const questions = readFileSync(
    new URL("./product-questions.tsx", import.meta.url),
    "utf8",
  );
  const shipping = readFileSync(
    new URL(
      "../../components/help/purchase-path/shipping-returns-disclosure.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const cards = readFileSync(
    new URL("./product-record-cards.tsx", import.meta.url),
    "utf8",
  );
  const specs = readFileSync(
    new URL("./product-specs.module.css", import.meta.url),
    "utf8",
  );
  const handmade = readFileSync(
    new URL("./product-handmade-note.module.css", import.meta.url),
    "utf8",
  );
  assert.equal(detail.includes("ProductMaking"), false);
  assert.equal(detail.includes("makingTitle"), false);
  assert.equal(questions.includes("<details"), false);
  assert.equal(shipping.includes("<details"), false);
  assert.equal(cards.includes("pdpQrLink"), false);
  assert.equal(cards.includes("/qr"), false);
  assert.equal(cards.includes("QrCode"), false);
  assert.match(specs, /grid-template-areas:\s*"label value"/);
  assert.match(handmade, /width:\s*100%/);
  assert.match(handmade, /text-align:\s*center/);
  assert.match(handmade, /align-items:\s*center/);
  assert.equal(handmade.includes("fit-content"), false);
  assert.equal(shipping.includes('id: "cost"'), false);
  const layout = readFileSync(
    new URL("./product-detail.module.css", import.meta.url),
    "utf8",
  );
  assert.match(layout, /\.foldList\s*\{[^}]*gap:\s*2\.25rem/);
  const passport = readFileSync(
    new URL("./product-record-cards.module.css", import.meta.url),
    "utf8",
  );
  assert.match(
    passport,
    /\.record\.passportCard > \.recordGo\s*\{[^}]*position:\s*relative/,
  );
  assert.equal(
    /\.record\.passportCard > \.recordGo\s*\{[^}]*inset-inline-end:/.test(
      passport,
    ),
    false,
  );
  assert.match(
    passport,
    /\[data-locale="fa"\] \.recordMedia\s*\{[^}]*inset-inline-start:\s*0/,
  );
});

test("artwork detail facts do not share one generic icon", () => {
  const color = specAttributeIconName("color");
  const maker = specAttributeIconName("maker");
  const made = specAttributeIconName("construction-time");
  const archive = specAttributeIconName("unic-id");
  assert.equal(new Set([color, maker, made, archive]).size, 4);
  assert.equal(
    [color, maker, made, archive].includes("SlidersHorizontal"),
    false,
  );
  const specs = readFileSync(
    new URL("./product-specs.tsx", import.meta.url),
    "utf8",
  );
  assert.equal(specs.includes("SlidersHorizontal"), false);
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
