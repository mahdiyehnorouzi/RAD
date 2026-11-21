import assert from "node:assert/strict";
import { test } from "node:test";
import { radPermanentUrl } from "@rad/types";
import {
  buildIdentityArchive,
  decodePngQr,
  decodeSvgQr,
  qrPng,
  qrSvg,
  verifyPublicIdentityUrls,
  type QrArtworkFile,
} from "./identity-print";

const rows: QrArtworkFile[] = [84, 85].map((radNumber) => ({
  radNumber,
  label: `RAD-${String(radNumber).padStart(3, "0")}`,
  url: radPermanentUrl(radNumber),
  status: "reserved" as const,
  productId: null,
  productName: null,
  batchId: "batch-1",
  storyPublished: false,
}));

test("a generated QR decodes to the canonical short URL", async () => {
  const url = radPermanentUrl(84);
  const { svg } = qrSvg(url);
  const png = await qrPng(url);
  assert.equal(decodeSvgQr(svg), url);
  assert.equal(decodePngQr(png), url);
  assert.equal(svg.includes("RAD-084"), false);
  assert.match(url, /^https:\/\/www\.rad-object\.com\/r\/084$/);
});

test("a batch archive matches the reserved identities", async () => {
  const archive = await buildIdentityArchive(rows);
  assert.equal(archive.verification.ok, true);
  assert.equal(archive.verification.fileCount, 4);
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(archive.buffer);
  assert.ok(zip.file("SVG/RAD-084.svg"));
  assert.ok(zip.file("PNG/RAD-085.png"));
  assert.ok(zip.file("manifest.csv"));
  assert.ok(zip.file("verification-report.csv"));
  const manifest = await zip.file("manifest.csv")!.async("string");
  assert.match(manifest, /84,RAD-084,https:\/\/www\.rad-object\.com\/r\/084/);
  assert.equal(manifest.trim().split("\n").length, 3);
});

test("public URL verification fails closed when a destination is wrong", async () => {
  const bad = await verifyPublicIdentityUrls({
    rows,
    origin: "http://127.0.0.1:9",
  });
  assert.equal(bad.ok, false);
});
