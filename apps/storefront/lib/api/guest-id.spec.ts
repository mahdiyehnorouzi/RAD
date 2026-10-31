import assert from "node:assert/strict";
import { test } from "node:test";
import { readOrCreateGuestId } from "./guest-id";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";

test("the same stored guest id is reused so the first requests share an owner", () => {
  const saved = new Map<string, string>();
  const storage = {
    getItem: (key: string) => saved.get(key) ?? null,
    setItem: (key: string, value: string) => {
      saved.set(key, value);
    },
  };
  assert.equal(
    readOrCreateGuestId(storage, () => A),
    A,
  );
  assert.equal(
    readOrCreateGuestId(storage, () => B),
    A,
  );
});
