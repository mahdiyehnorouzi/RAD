import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { PDP_ASSURANCES } from "./const/pdp-assurances";
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
  assert.match(specs, /grid-template-areas:\s*"label value"/);
  assert.match(handmade, /width:\s*100%/);
  assert.equal(handmade.includes("fit-content"), false);
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
