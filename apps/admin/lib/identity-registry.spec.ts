import assert from "node:assert/strict";
import { test } from "node:test";
import {
  activeIdentityCard,
  artworkStoryIsPublic,
  identityFilterForCard,
  productEditorHref,
  publicPassportUrl,
} from "./identity-registry";

test("summary cards map to the registry filters they claim", () => {
  assert.deepEqual(identityFilterForCard("all"), {
    status: "",
    assignment: "",
    printed: "",
  });
  assert.deepEqual(identityFilterForCard("unassigned"), {
    status: "reserved",
    assignment: "unassigned",
    printed: "",
  });
  assert.deepEqual(identityFilterForCard("assigned"), {
    status: "assigned",
    assignment: "assigned",
    printed: "",
  });
  assert.deepEqual(identityFilterForCard("printed"), {
    status: "",
    assignment: "",
    printed: "printed",
  });
  assert.equal(
    activeIdentityCard({ ...identityFilterForCard("retired"), batchId: "" }),
    "retired",
  );
  assert.equal(
    activeIdentityCard({
      ...identityFilterForCard("all"),
      batchId: "batch-1",
    }),
    null,
  );
});

test("story editing stays on the product editor and unpublished work stays off the passport", () => {
  assert.equal(
    productEditorHref("prod-1", "story"),
    "/products?edit=prod-1&section=story",
  );
  assert.equal(productEditorHref("prod-1", "artwork"), "/products?edit=prod-1");
  assert.equal(artworkStoryIsPublic("draft"), false);
  assert.equal(artworkStoryIsPublic("available"), true);
  assert.equal(
    publicPassportUrl("https://www.rad-object.com/r/082", "082"),
    "https://www.rad-object.com/passport/082",
  );
});
