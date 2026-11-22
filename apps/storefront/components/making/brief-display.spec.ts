import assert from "node:assert/strict";
import { test } from "node:test";
import {
  colorSwatches,
  permissionView,
  safeAttachmentSrc,
} from "./brief-display";

test("selected designer colours keep their name and swatch, and unknown values are not invented", () => {
  const swatches = colorSwatches(["#d89e89", "gloss", "sunrise", ""], "fa");
  assert.deepEqual(
    swatches.map((item) => item.label),
    ["صورتی", "براق", "sunrise"],
  );
  assert.equal(swatches[0]?.background, "#d89e89");
  assert.ok(swatches[1]?.background?.includes("radial-gradient"));
  assert.equal(swatches[2]?.background, null);
  assert.equal(colorSwatches(undefined, "fa").length, 0);
});

test("surprise permission is Persian for yes, no, and an explicit empty answer", () => {
  assert.equal(permissionView(undefined, "fa").state, "missing");
  assert.equal(permissionView(null, "fa").state, "unknown");
  assert.equal(permissionView(true, "fa").state, "allowed");
  assert.equal(permissionView(false, "en").state, "refused");
  const faithful = permissionView("faithful", "fa");
  const material = permissionView("material", "fa");
  assert.equal(faithful.state, "noted");
  assert.equal(material.state, "noted");
  if (faithful.state === "noted") assert.match(faithful.text, /طرح/);
  if (material.state === "noted") assert.doesNotMatch(material.text, /material/);
  assert.equal(permissionView("hand", "fa").state, "noted");
});

test("request files only render from safe sources", () => {
  assert.equal(safeAttachmentSrc("javascript:alert(1)"), null);
  assert.equal(safeAttachmentSrc("data:text/html,<script>"), null);
  assert.equal(safeAttachmentSrc("http://files.example/a.jpg"), null);
  assert.equal(
    safeAttachmentSrc("data:image/png;base64,aaaa"),
    "data:image/png;base64,aaaa",
  );
  assert.equal(safeAttachmentSrc("/making/private/a.webp"), "/making/private/a.webp");
  assert.equal(safeAttachmentSrc(""), null);
});
