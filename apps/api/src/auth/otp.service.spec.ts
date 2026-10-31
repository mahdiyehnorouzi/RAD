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
import { OtpCode } from "../database/entities";
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

  otp = new OtpService(dataSource.getRepository(OtpCode), fakeSms, dataSource);
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
  assert.ok(result.expiresInSeconds > 0);
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
  assert.ok(result.expiresInSeconds > 0);
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
