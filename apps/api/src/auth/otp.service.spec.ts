import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import EmbeddedPostgres from "embedded-postgres";
import type { DataSource } from "typeorm";
import { createAppDataSource } from "../database/data-source";
import { OtpCode, OtpRequestLog } from "../database/entities";
import { OtpService } from "./otp.service";
import type { MelipayamakService } from "../sms/melipayamak.service";

function freePort() {
  return new Promise<number>((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close(() => resolve(port));
    });
  });
}

let pg: EmbeddedPostgres;
let dataSource: DataSource;
let databaseDir: string;
let sent: Array<{ to: string; code: string }>;
let sendShouldFail = false;
let otp: OtpService;

before(async () => {
  databaseDir = mkdtempSync(path.join(tmpdir(), "rad-otp-"));
  const port = await freePort();
  pg = new EmbeddedPostgres({
    databaseDir,
    user: "rad",
    password: "rad",
    port,
    persistent: false,
    onLog: () => {},
    onError: () => {},
  });
  await pg.initialise();
  await pg.start();
  await pg.createDatabase("rad_otp_test");
  dataSource = createAppDataSource({
    url: `postgresql://rad:rad@127.0.0.1:${port}/rad_otp_test`,
    synchronize: true,
  } as never);
  await dataSource.initialize();

  sent = [];
  const fakeSms = {
    sendOtp: async (to: string, code: string) => {
      if (sendShouldFail) throw new Error("send failed");
      sent.push({ to, code });
    },
  } as unknown as MelipayamakService;

  otp = new OtpService(
    dataSource.getRepository(OtpCode),
    dataSource.getRepository(OtpRequestLog),
    fakeSms,
    dataSource,
  );
});

after(async () => {
  await dataSource?.destroy();
  await pg?.stop();
  rmSync(databaseDir, { recursive: true, force: true });
});

test("rejects an invalid phone number before ever touching SMS", async () => {
  await assert.rejects(
    () => otp.requestCode("not-a-phone"),
    BadRequestException,
  );
  assert.equal(sent.length, 0);
});

test("requesting a code sends exactly one SMS with a 6-digit code", async () => {
  sent = [];
  const result = await otp.requestCode("09121111111");
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "09121111111");
  assert.match(sent[0].code, /^\d{6}$/);
  assert.equal(result.expiresInSeconds, 180);
  const row = await dataSource
    .getRepository(OtpCode)
    .findOneByOrFail({ phone: "09121111111" });
  const remainingMs = row.expiresAt.getTime() - Date.now();
  assert.ok(remainingMs <= 180_000);
  assert.ok(remainingMs > 180_000 - 5_000);
});

test("resending immediately for the same phone is refused (cooldown)", async () => {
  sent = [];
  await otp.requestCode("09122222222");
  await assert.rejects(
    () => otp.requestCode("09122222222"),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      assert.equal(
        (error.getResponse() as { code?: string }).code,
        "otp_cooldown",
      );
      return true;
    },
  );
  assert.equal(sent.length, 1);
});

test("the correct code verifies successfully, and consumes the code", async () => {
  sent = [];
  await otp.requestCode("09123333333");
  const code = sent[0].code;
  const result = await otp.verifyCode("09123333333", code);
  assert.deepEqual(result, { verified: true, phone: "09123333333" });

  // The same code cannot verify twice.
  await assert.rejects(
    () => otp.verifyCode("09123333333", code),
    NotFoundException,
  );
});

test("an expired code cannot be verified, even when the digits still match", async () => {
  sent = [];
  await otp.requestCode("09120000333");
  const code = sent[0].code;
  await dataSource
    .getRepository(OtpCode)
    .update(
      { phone: "09120000333" },
      { expiresAt: new Date(Date.now() - 1_000) },
    );

  await assert.rejects(
    () => otp.verifyCode("09120000333", code),
    (error: unknown) => {
      assert.ok(error instanceof NotFoundException);
      assert.equal(
        (error.getResponse() as { code?: string }).code,
        "otp_expired",
      );
      return true;
    },
  );
});

test("a wrong code is refused and does not consume the real one", async () => {
  sent = [];
  await otp.requestCode("09124444444");
  const realCode = sent[0].code;
  const wrongCode = realCode === "111111" ? "222222" : "111111";

  await assert.rejects(
    () => otp.verifyCode("09124444444", wrongCode),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      assert.equal(
        (error.getResponse() as { code?: string }).code,
        "otp_invalid",
      );
      return true;
    },
  );

  // The real code still works afterwards.
  const result = await otp.verifyCode("09124444444", realCode);
  assert.equal(result.verified, true);
});

test("exceeding the verify-attempt limit locks the code out, even with the right code", async () => {
  sent = [];
  await otp.requestCode("09125555555");
  const realCode = sent[0].code;
  const wrongCode = realCode === "111111" ? "222222" : "111111";

  for (let i = 0; i < 5; i++) {
    await assert.rejects(() => otp.verifyCode("09125555555", wrongCode));
  }
  await assert.rejects(
    () => otp.verifyCode("09125555555", realCode),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      assert.equal(
        (error.getResponse() as { code?: string }).code,
        "otp_too_many_attempts",
      );
      return true;
    },
  );
});

test("a failed SMS send does not leave a code active (no cooldown-blocked retry on a code nobody received)", async () => {
  sent = [];
  sendShouldFail = true;
  await assert.rejects(() => otp.requestCode("09126666666"));
  sendShouldFail = false;

  // Immediately retrying must succeed — not blocked by the cooldown from
  // the failed attempt.
  const result = await otp.requestCode("09126666666");
  assert.equal(result.expiresInSeconds, 180);
});

test("a later request for the same phone invalidates the earlier unconsumed code", async () => {
  sent = [];
  await otp.requestCode("09127777777");
  const firstCode = sent[0].code;

  // Wait past the resend cooldown isn't practical in a fast test; delete
  // the cooldown-triggering row directly to simulate "later" without a
  // real 60s sleep, then request again.
  await dataSource
    .getRepository(OtpCode)
    .update({ phone: "09127777777" }, { createdAt: new Date(0) });
  await otp.requestCode("09127777777");
  const secondCode = sent[1].code;

  // The first code's row is gone (deleted when the second request was
  // made), so trying it now compares against the *second* code's hash and
  // fails as a wrong code, not a missing/expired one — proving the old
  // code genuinely no longer verifies, whatever it's rejected as.
  await assert.rejects(() => otp.verifyCode("09127777777", firstCode));
  const result = await otp.verifyCode("09127777777", secondCode);
  assert.equal(result.verified, true);
});

test("a phone that sends 5 codes in the window is rate-limited on the 6th, even after each cooldown", async () => {
  sent = [];
  const phone = "09129999999";

  for (let i = 0; i < 5; i++) {
    await otp.requestCode(phone);
    // Clear the cooldown-triggering row so the *next* send isn't blocked
    // by the 60s cooldown — isolates this test to the rate limit, not the
    // cooldown (already covered above).
    await dataSource
      .getRepository(OtpCode)
      .update({ phone }, { createdAt: new Date(0) });
  }
  assert.equal(sent.length, 5);

  await assert.rejects(
    () => otp.requestCode(phone),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      assert.equal(
        (error.getResponse() as { code?: string }).code,
        "otp_rate_limited",
      );
      return true;
    },
  );
  // The 6th attempt never reached the SMS provider.
  assert.equal(sent.length, 5);
});

test("a rate-limited phone's failed sends still count toward the limit (no free retries via forced failures)", async () => {
  sent = [];
  sendShouldFail = true;
  const phone = "09121010101";

  for (let i = 0; i < 5; i++) {
    await assert.rejects(() => otp.requestCode(phone));
    // Each failed send clears its own cooldown-triggering row (restoring
    // the existing failure-recovery guarantee) but leaves its
    // `OtpRequestLog` row behind.
  }
  sendShouldFail = false;

  await assert.rejects(
    () => otp.requestCode(phone),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      assert.equal(
        (error.getResponse() as { code?: string }).code,
        "otp_rate_limited",
      );
      return true;
    },
  );
  assert.equal(sent.length, 0, "no SMS should ever have been sent");
});

test("a burst of parallel requests for a fresh phone cannot together exceed the rate limit (concurrency-safe sending)", async () => {
  sent = [];
  const phone = "09121212121";

  // 10 simultaneous first-time requests for the same phone. Without the
  // advisory-lock serialization, every one of them can count 0 prior
  // sends before any single insert commits, so all 10 would pass the
  // "< 5" check and all 10 would page the SMS provider.
  const results = await Promise.allSettled(
    Array.from({ length: 10 }, () => otp.requestCode(phone)),
  );
  const succeeded = results.filter((result) => result.status === "fulfilled");
  const failed = results.filter((result) => result.status === "rejected");

  // The cooldown (60s, one active send at a time) means at most 1 of the
  // 10 concurrent sends should actually go through — the rest must fail
  // on cooldown or the rate limit, never by all silently succeeding.
  assert.ok(succeeded.length <= 1, "cooldown must cap concurrent sends to 1");
  assert.equal(succeeded.length + failed.length, 10);
  assert.equal(sent.length, succeeded.length);
});

test("a burst of parallel wrong guesses cannot bypass the attempt cap (concurrency-safe verification)", async () => {
  sent = [];
  await otp.requestCode("09128888888");
  const realCode = sent[0].code;
  const wrongCode = realCode === "111111" ? "222222" : "111111";

  // 20 simultaneous wrong guesses against the same code. Without a row
  // lock serializing the read-check-increment, every one of them can read
  // `attempts: 0` before any single increment commits, so all 20 pass the
  // "< 5" check and the real code would still verify afterwards — the cap
  // existing only on paper.
  const results = await Promise.allSettled(
    Array.from({ length: 20 }, () => otp.verifyCode("09128888888", wrongCode)),
  );
  assert.ok(
    results.every((result) => result.status === "rejected"),
    "every wrong guess must be rejected",
  );

  // The cap must have actually been enforced: the real code no longer
  // verifies, because attempts correctly accumulated to >= 5 despite the
  // concurrency.
  await assert.rejects(
    () => otp.verifyCode("09128888888", realCode),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      assert.equal(
        (error.getResponse() as { code?: string }).code,
        "otp_too_many_attempts",
      );
      return true;
    },
  );
});
