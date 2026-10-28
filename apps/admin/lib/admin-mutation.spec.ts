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

test("a reply draft is cleared only after the server accepts it", async () => {
  const flight = createSingleFlight();
  let draft = "پاسخ تایپ‌شده";
  await assert.rejects(
    () =>
      flight.run(async () => {
        throw new Error("ارسال پاسخ ناموفق بود. متن پیام حفظ شده است.");
      }),
    /متن پیام حفظ شده است/,
  );
  assert.equal(draft, "پاسخ تایپ‌شده");

  const accepted = await flight.run(async () => {
    draft = "";
    return "ok";
  });
  assert.equal(accepted.status, "ran");
  assert.equal(draft, "");
});

test("a failed destructive confirm is not retried and can be clicked again by the user", async () => {
  const flight = createSingleFlight();
  let deletes = 0;
  await assert.rejects(() =>
    flight.run(async () => {
      deletes += 1;
      throw new Error("حذف نشد");
    }),
  );
  assert.equal(deletes, 1);
  assert.equal(flight.pending, false);

  const ignoredWhilePending = flight.run(async () => {
    deletes += 1;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return "deleted";
  });
  const secondClick = await flight.run(async () => {
    deletes += 1;
    return "again";
  });
  assert.equal(secondClick.status, "ignored");
  assert.deepEqual(await ignoredWhilePending, {
    status: "ran",
    value: "deleted",
  });
  assert.equal(deletes, 2);
});

test("an invite failure keeps the typed name and email", async () => {
  const flight = createSingleFlight();
  const form = { name: "سحر دعوت", email: "sahar-invite@example.com" };
  await assert.rejects(() =>
    flight.run(async () => {
      throw new Error("دعوت ثبت نشد. نام و ایمیل سر جایشان است.");
    }),
  );
  assert.deepEqual(form, {
    name: "سحر دعوت",
    email: "sahar-invite@example.com",
  });
});
