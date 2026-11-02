import "reflect-metadata";
import assert from "node:assert/strict";
import { test } from "node:test";
import { BadRequestException, ValidationPipe } from "@nestjs/common";
import { UpdateOrderDto } from "./update-order.dto";

// Same instance/config `main.ts` installs globally (`whitelist`, `transform`,
// `forbidNonWhitelisted`) — this exercises the real pipe the HTTP layer runs
// on every request, not a reimplementation of it. See `cart.controller.spec.ts`
// for the established pattern this mirrors.
const pipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
});

test("UpdateOrderDto: status and trackingCode pass the global validation pipe", async () => {
  const statusOnly = await pipe.transform(
    { status: "packing" },
    { type: "body", metatype: UpdateOrderDto },
  );
  assert.equal(statusOnly.status, "packing");
  assert.equal(statusOnly.trackingCode, undefined);

  const withTracking = await pipe.transform(
    { status: "shipped", trackingCode: "IR-POST-123456789" },
    { type: "body", metatype: UpdateOrderDto },
  );
  assert.equal(withTracking.trackingCode, "IR-POST-123456789");
});

test("Issue #145: the DTO's MaxLength(40) sanity bound rejects an excessively long raw tracking code through the pipe", async () => {
  await assert.rejects(
    () =>
      pipe.transform(
        { status: "shipped", trackingCode: "A".repeat(41) },
        { type: "body", metatype: UpdateOrderDto },
      ),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      const body = error.getResponse() as { message?: string | string[] };
      const message = Array.isArray(body.message)
        ? body.message[0]
        : body.message;
      assert.equal(message, "کد رهگیری خیلی طولانی است.");
      return true;
    },
  );
});

test("Issue #145: a 40-character raw tracking code is exactly at the DTO boundary and still passes the pipe", async () => {
  const atBoundary = await pipe.transform(
    { status: "shipped", trackingCode: "A".repeat(40) },
    { type: "body", metatype: UpdateOrderDto },
  );
  assert.equal(atBoundary.trackingCode, "A".repeat(40));
});

test("Issue #145: a realistically grouped-and-separated 32-character carrier code stays under the 40-character raw limit", () => {
  // The DTO bounds the *raw* payload (whitespace/dashes included); the
  // business rule in AdminService strips those before checking the 4-32
  // normalized-character limit (see `normalizeTrackingNumber`). A carrier
  // code at the normalized maximum (32 chars), grouped in blocks of 4 the
  // way real tracking numbers are commonly displayed, must still fit under
  // the DTO's 40-raw-character sanity bound or a legitimate code would be
  // rejected before the real rule ever runs.
  const digits = "12345678901234567890123456789012"; // 32 digits
  assert.equal(digits.length, 32);
  const grouped = digits.match(/.{1,4}/g)!.join("-");
  assert.equal(grouped.length, 39, "8 groups of 4 plus 7 dashes = 39 chars");
  assert.ok(grouped.length <= 40, "fits the DTO's raw-length sanity bound");
});

test("Issue #145: Persian digits in a tracking code do not inflate the raw character count (1 char each) and stay under the limit", () => {
  const persianDigits = "۱۲۳۴۵۶۷۸۹۰۱۲۳۴۵۶۷۸۹۰۱۲۳۴۵۶۷۸۹۰۱۲"; // 32 Persian digits
  assert.equal(
    [...persianDigits].length,
    32,
    "each Persian digit is a single character, same as its Latin form",
  );
  const grouped = [...persianDigits]
    .reduce<string[]>((groups, char, index) => {
      if (index % 4 === 0) groups.push("");
      groups[groups.length - 1] += char;
      return groups;
    }, [])
    .join("-");
  assert.ok(
    [...grouped].length <= 40,
    "a grouped, separator-formatted Persian-digit code still fits the raw bound",
  );
});

test("UpdateOrderDto still rejects an unknown status and strips unexpected fields (unaffected by this change)", async () => {
  await assert.rejects(
    () =>
      pipe.transform(
        { status: "not-a-real-status" },
        { type: "body", metatype: UpdateOrderDto },
      ),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      return true;
    },
  );

  await assert.rejects(
    () =>
      pipe.transform(
        { status: "packing", trackingCode: "VALIDCODE1", extra: "injected" },
        { type: "body", metatype: UpdateOrderDto },
      ),
    (error: unknown) => {
      assert.ok(error instanceof BadRequestException);
      return true;
    },
  );
});
