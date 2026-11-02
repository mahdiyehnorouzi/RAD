import assert from "node:assert/strict";
import { test } from "node:test";
import { createRequestGate } from "./request-gate";

test("the second call waits until the first response, then calls run together", async () => {
  const gate = createRequestGate();
  const order: string[] = [];
  let releaseFirst!: () => void;
  const first = gate(
    () =>
      new Promise<string>((resolve) => {
        order.push("first-start");
        releaseFirst = () => {
          order.push("first-end");
          resolve("one");
        };
      }),
  );
  const second = gate(async () => {
    order.push("second-start");
    return "two";
  });
  await Promise.resolve();
  assert.deepEqual(order, ["first-start"]);
  releaseFirst();
  assert.deepEqual(await Promise.all([first, second]), ["one", "two"]);
  assert.deepEqual(order, ["first-start", "first-end", "second-start"]);

  order.length = 0;
  await gate(async () => {
    order.push("third");
  });
  assert.deepEqual(order, ["third"]);
});
