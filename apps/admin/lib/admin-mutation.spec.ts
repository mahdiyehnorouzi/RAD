import assert from "node:assert/strict";
import { test } from "node:test";
import { createSingleFlight } from "./admin-mutation";

test("a second submit while the first is pending is ignored", async () => {
  const flight = createSingleFlight();
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let calls = 0;
  const first = flight.run(async () => {
    calls += 1;
    await gate;
    return "saved";
  });
  const second = await flight.run(async () => {
    calls += 1;
    return "again";
  });
  assert.equal(second.status, "ignored");
  assert.equal(flight.pending, true);
  release();
  const finished = await first;
  assert.deepEqual(finished, { status: "ran", value: "saved" });
  assert.equal(calls, 1);
  assert.equal(flight.pending, false);
});

test("a failed action is not retried automatically and form-sized input can be submitted again", async () => {
  const flight = createSingleFlight();
  let calls = 0;
  await assert.rejects(
    () =>
      flight.run(async () => {
        calls += 1;
        throw new Error("ذخیره نشد");
      }),
    /ذخیره نشد/,
  );
  assert.equal(calls, 1);
  assert.equal(flight.pending, false);

  const draft = "متن پاسخ";
  let kept = draft;
  const retried = await flight.run(async () => {
    calls += 1;
    kept = "";
    return "ok";
  });
  assert.equal(retried.status, "ran");
  assert.equal(calls, 2);
  assert.equal(kept, "");
});

test("a failed mutation leaves the caller-owned value unchanged", async () => {
  const flight = createSingleFlight();
  const draft = "پاسخ مشتری";
  await assert.rejects(() =>
    flight.run(async () => {
      throw new Error("ارتباط قطع شد");
    }),
  );
  assert.equal(draft, "پاسخ مشتری");
  assert.equal(flight.pending, false);
});
