import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("the in-cart floating pill puts the bag icon before the forward arrow in source order", () => {
  const source = readFileSync(
    new URL("./product-floating-buy.tsx", import.meta.url),
    "utf8",
  );
  const pillBlocks = [
    ...source.matchAll(
      /<Link\s+className={styles\.goToBagPill}[\s\S]*?<\/Link>/g,
    ),
  ];
  const inCartBlock = pillBlocks.find((match) =>
    match[0].includes("ShoppingBag"),
  );
  assert.ok(
    inCartBlock,
    "expected a goToBagPill Link rendering the ShoppingBag icon",
  );
  const body = inCartBlock![0];
  const bagIndex = body.indexOf("<ShoppingBag");
  const arrowIndex = body.indexOf("<Forward");
  assert.ok(bagIndex > -1, "expected a ShoppingBag icon in the pill");
  assert.ok(arrowIndex > -1, "expected the Forward arrow in the pill");
  // display:flex with no row-reverse means source order is reading-start
  // to reading-end in both directions — the bag icon (next to the label)
  // must come before the directional arrow (the outer edge cue).
  assert.ok(
    bagIndex < arrowIndex,
    "expected the bag icon before the forward arrow in source order",
  );
});
