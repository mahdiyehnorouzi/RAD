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
import { classifyLegacyArtwork } from "./legacy-artwork";

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

test("a legacy artwork archive lists the product without a batch id", async () => {
  const legacy: QrArtworkFile[] = [
    {
      radNumber: 60,
      label: "RAD-060",
      url: radPermanentUrl(60),
      status: "assigned",
      productId: "product-60",
      productName: "بافته قدیمی",
      batchId: null,
      storyPublished: true,
    },
  ];
  const archive = await buildIdentityArchive(legacy, {
    artworkCsv: true,
    inconsistencies: [
      {
        productId: "gap",
        radNumber: 14,
        issue: "missing_identity",
        detail: "آدرس دائمی به همین اثر می‌رسد و شناسه تازه‌ای ساخته نشد",
      },
    ],
  });
  assert.equal(archive.verification.ok, true);
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(archive.buffer);
  const svg = await zip.file("SVG/RAD-060.svg")!.async("string");
  const png = await zip.file("PNG/RAD-060.png")!.async("nodebuffer");
  assert.equal(decodeSvgQr(svg), "https://www.rad-object.com/r/060");
  assert.equal(decodePngQr(png), "https://www.rad-object.com/r/060");
  const mapping = await zip.file("artworks.csv")!.async("string");
  assert.match(
    mapping,
    /productId,artworkName,radNumber,permanentUrl\nproduct-60,بافته قدیمی,60,https:\/\/www\.rad-object\.com\/r\/060/,
  );
  assert.equal(mapping.includes("batchId"), false);
  const gaps = await zip.file("inconsistencies.csv")!.async("string");
  assert.match(gaps, /gap,14,missing_identity/);
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

test("a mismatched or reserved number is not a printable legacy QR", () => {
  const product = {
    id: "woven",
    name: "بافته",
    status: "available",
    radNumber: 60,
  };
  const mismatch = classifyLegacyArtwork({
    product,
    identities: [
      {
        radNumber: 80,
        status: "assigned",
        productId: "woven",
        batchId: null,
      },
    ],
    resolvedProductId: "woven",
  });
  assert.equal(mismatch.row, null);
  assert.equal(mismatch.gap?.issue, "identity_mismatch");

  const reserved = classifyLegacyArtwork({
    product: { ...product, id: "collision", radNumber: 61 },
    identities: [
      {
        radNumber: 61,
        status: "reserved",
        productId: null,
        batchId: "batch-new",
      },
    ],
    resolvedProductId: null,
  });
  assert.equal(reserved.row, null);
  assert.equal(reserved.gap?.issue, "url_not_this_artwork");

  const missing = classifyLegacyArtwork({
    product: { ...product, id: "gap", radNumber: 14 },
    identities: [],
    resolvedProductId: "gap",
  });
  assert.equal(missing.row?.url, "https://www.rad-object.com/r/014");
  assert.equal(missing.row?.productId, "gap");
  assert.equal(missing.gap?.issue, "missing_identity");

  const wrongDestination = classifyLegacyArtwork({
    product: { ...product, id: "gap", radNumber: 14 },
    identities: [],
    resolvedProductId: "someone-else",
  });
  assert.equal(wrongDestination.row, null);
  assert.equal(wrongDestination.gap?.issue, "url_not_this_artwork");
});

test("public URL verification fails closed when a destination is wrong", async () => {
  const bad = await verifyPublicIdentityUrls({
    rows,
    origin: "http://127.0.0.1:9",
  });
  assert.equal(bad.ok, false);
});
