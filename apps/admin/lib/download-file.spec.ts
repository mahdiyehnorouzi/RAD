import assert from "node:assert/strict";
import { test } from "node:test";
import {
  filenameFromContentDisposition,
  invalidDownloadReason,
  readDownload,
  shouldShareDownload,
} from "./download-file";

test("download names prefer the server filename and reject HTML or empty bodies", () => {
  assert.equal(
    filenameFromContentDisposition(
      'attachment; filename="RAD-082.svg"',
      "fallback.svg",
    ),
    "RAD-082.svg",
  );
  assert.equal(
    filenameFromContentDisposition(
      "attachment; filename*=UTF-8''RAD-082.zip",
      "fallback.zip",
    ),
    "RAD-082.zip",
  );
  assert.equal(
    invalidDownloadReason({
      size: 0,
      type: "image/png",
      head: new Uint8Array(),
    }),
    "فایل دانلود خالی است.",
  );
  assert.equal(
    invalidDownloadReason({
      size: 20,
      type: "text/html",
      head: Uint8Array.from([0x3c]),
    }),
    "فایل دانلود نامعتبر است.",
  );
  assert.equal(
    invalidDownloadReason({
      size: 8,
      type: "image/png",
      head: Uint8Array.from([0x89, 0x50, 0x4e, 0x47]),
    }),
    null,
  );
  assert.equal(
    invalidDownloadReason({
      size: 8,
      type: "application/zip",
      head: Uint8Array.from([0x50, 0x4b, 0x03, 0x04]),
    }),
    null,
  );
});

test("a failed response never becomes a saved file, and iOS uses the share sheet", async () => {
  const failed = await readDownload(
    {
      ok: false,
      blob: async () => new Blob(),
      headers: { get: () => null },
    },
    "RAD-082.svg",
  );
  assert.deepEqual(failed, { error: "دانلود انجام نشد. دوباره تلاش کنید." });
  const svg = new Blob(
    ['<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"/>'],
    {
      type: "image/svg+xml",
    },
  );
  const saved = await readDownload(
    {
      ok: true,
      blob: async () => svg,
      headers: { get: () => 'attachment; filename="RAD-082.svg"' },
    },
    "fallback.svg",
  );
  assert.ok("blob" in saved);
  if ("blob" in saved) assert.equal(saved.filename, "RAD-082.svg");
  assert.equal(
    shouldShareDownload("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5)", true),
    true,
  );
  assert.equal(shouldShareDownload("Mozilla/5.0 (Macintosh)", true), false);
  assert.equal(shouldShareDownload("Mozilla/5.0 (iPhone)", false), false);
});
