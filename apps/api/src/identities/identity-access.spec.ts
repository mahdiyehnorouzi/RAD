import assert from "node:assert/strict";
import { test } from "node:test";
import { assertIdentityWrite } from "./admin-identities.controller";

test("a viewer cannot reserve or assign identities", () => {
  assert.throws(
    () => assertIdentityWrite("viewer"),
    (error: unknown) => {
      assert.equal((error as { getStatus?: () => number }).getStatus?.(), 403);
      return true;
    },
  );
});

test("an editor with product write can manage identities", () => {
  assert.doesNotThrow(() => assertIdentityWrite("editor"));
  assert.doesNotThrow(() => assertIdentityWrite("owner"));
});

test("a missing role is refused", () => {
  assert.throws(() => assertIdentityWrite(undefined));
});
