import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { looksLikeMp4, looksLikeWebm, sniffImage } from "./media-signature";

function u32(value: number) {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(value, 0);
  return buf;
}

describe("sniffImage — PNG", () => {
  test("reads real width/height from the IHDR chunk", () => {
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const body = Buffer.alloc(13);
    body.writeUInt32BE(800, 0);
    body.writeUInt32BE(600, 4);
    const png = Buffer.concat([sig, u32(13), Buffer.from("IHDR"), body, Buffer.alloc(4)]);
    assert.deepEqual(sniffImage(png), { format: "png", width: 800, height: 600 });
  });

  test("rejects a PNG magic number with a non-IHDR first chunk", () => {
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const fake = Buffer.concat([sig, u32(13), Buffer.from("fake"), Buffer.alloc(17)]);
    assert.equal(sniffImage(fake), null);
  });
});

describe("sniffImage — JPEG", () => {
  test("reads real width/height from the SOF0 marker", () => {
    const soi = Buffer.from([0xff, 0xd8]);
    const sof0 = Buffer.concat([
      Buffer.from([0xff, 0xc0]),
      Buffer.from([0x00, 0x11]), // length = 17
      Buffer.from([0x08]), // precision
      Buffer.from([0x02, 0x58]), // height = 600
      Buffer.from([0x03, 0x20]), // width = 800
      Buffer.alloc(12),
    ]);
    const jpeg = Buffer.concat([soi, sof0]);
    assert.deepEqual(sniffImage(jpeg), { format: "jpeg", width: 800, height: 600 });
  });

  test("skips an APP0/JFIF marker before reaching SOF0", () => {
    const soi = Buffer.from([0xff, 0xd8]);
    const app0 = Buffer.concat([Buffer.from([0xff, 0xe0]), u16(16), Buffer.alloc(14)]);
    const sof0 = Buffer.concat([
      Buffer.from([0xff, 0xc0]),
      u16(17),
      Buffer.from([0x08]),
      u16(100),
      u16(200),
      Buffer.alloc(12),
    ]);
    const jpeg = Buffer.concat([soi, app0, sof0]);
    assert.deepEqual(sniffImage(jpeg), { format: "jpeg", width: 200, height: 100 });
  });

  test("rejects a file that only has the FFD8 magic and no SOF marker", () => {
    const jpeg = Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.from([0xff, 0xda]), Buffer.alloc(4)]);
    assert.equal(sniffImage(jpeg), null);
  });

  test("accepts a spec-legal run of 0xFF fill/padding bytes before a marker (JPEG T.81 B.1.1.2)", () => {
    const soi = Buffer.from([0xff, 0xd8]);
    // Three stray 0xFF padding bytes before the real APP0 marker code.
    const paddedApp0 = Buffer.concat([
      Buffer.from([0xff, 0xff, 0xff, 0xe0]),
      u16(16),
      Buffer.alloc(14),
    ]);
    const sof0 = Buffer.concat([
      Buffer.from([0xff, 0xc0]),
      u16(17),
      Buffer.from([0x08]),
      u16(50),
      u16(60),
      Buffer.alloc(12),
    ]);
    const jpeg = Buffer.concat([soi, paddedApp0, sof0]);
    assert.deepEqual(sniffImage(jpeg), { format: "jpeg", width: 60, height: 50 });
  });

  test("rejects a buffer that is nothing but repeated 0xFF bytes (no real marker ever found)", () => {
    assert.equal(sniffImage(Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(64, 0xff)])), null);
  });
});

describe("sniffImage — truncated/malformed inputs never crash, only reject", () => {
  test("PNG truncated before the IHDR width/height bytes are fully present", () => {
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const truncated = Buffer.concat([sig, u32(13), Buffer.from("IHDR"), Buffer.alloc(2)]);
    assert.equal(sniffImage(truncated), null);
  });

  test("JPEG truncated mid-marker-length field", () => {
    const soi = Buffer.from([0xff, 0xd8]);
    const truncatedMarker = Buffer.from([0xff, 0xc0, 0x00]); // length field cut off
    assert.equal(sniffImage(Buffer.concat([soi, truncatedMarker])), null);
  });

  test("JPEG with a marker claiming a length that overruns the buffer", () => {
    const soi = Buffer.from([0xff, 0xd8]);
    const overrun = Buffer.concat([Buffer.from([0xff, 0xc0]), u16(60000), Buffer.alloc(4)]);
    assert.equal(sniffImage(Buffer.concat([soi, overrun])), null);
  });

  test("WebP RIFF header truncated before the format chunk tag", () => {
    const partial = Buffer.alloc(14);
    partial.write("RIFF", 0, "ascii");
    partial.write("WEBP", 8, "ascii");
    assert.equal(sniffImage(partial), null);
  });

  test("a buffer of all zero bytes is rejected outright (no magic number matches)", () => {
    assert.equal(sniffImage(Buffer.alloc(1024)), null);
  });
});

describe("sniffImage — WebP", () => {
  test("reads real width/height from a VP8 (lossy) chunk", () => {
    const header = Buffer.alloc(30);
    header.write("RIFF", 0, "ascii");
    header.write("WEBP", 8, "ascii");
    header.write("VP8 ", 12, "ascii");
    header[23] = 0x9d;
    header[24] = 0x01;
    header[25] = 0x2a;
    header.writeUInt16LE(320, 26); // width
    header.writeUInt16LE(240, 28); // height
    assert.deepEqual(sniffImage(header), { format: "webp", width: 320, height: 240 });
  });

  test("rejects a RIFF file that isn't WEBP", () => {
    const header = Buffer.alloc(30);
    header.write("RIFF", 0, "ascii");
    header.write("AVI ", 8, "ascii");
    assert.equal(sniffImage(header), null);
  });
});

describe("sniffImage — forged/unknown bytes", () => {
  test("a text file claiming to be an image is still rejected", () => {
    assert.equal(sniffImage(Buffer.from("<html>not an image</html>")), null);
  });

  test("an empty buffer is rejected, not treated as valid", () => {
    assert.equal(sniffImage(Buffer.alloc(0)), null);
  });
});

function u16(value: number) {
  const buf = Buffer.alloc(2);
  buf.writeUInt16BE(value, 0);
  return buf;
}

describe("looksLikeMp4", () => {
  test("accepts ftyp + moov both present in the head slice", () => {
    const ftyp = Buffer.concat([u32(16), Buffer.from("ftyp"), Buffer.alloc(8)]);
    const moov = Buffer.concat([u32(8), Buffer.from("moov")]);
    assert.equal(looksLikeMp4(Buffer.concat([ftyp, moov])), true);
  });

  test("accepts moov found only in a separately-supplied tail slice", () => {
    const ftyp = Buffer.concat([u32(16), Buffer.from("ftyp"), Buffer.alloc(8)]);
    const moov = Buffer.concat([u32(8), Buffer.from("moov")]);
    assert.equal(looksLikeMp4(ftyp, moov), true);
  });

  test("rejects a file with no ftyp box at all", () => {
    const moov = Buffer.concat([u32(8), Buffer.from("moov")]);
    assert.equal(looksLikeMp4(moov), false);
  });

  test("rejects ftyp with no moov anywhere (head or tail)", () => {
    const ftyp = Buffer.concat([u32(16), Buffer.from("ftyp"), Buffer.alloc(8)]);
    const junkTail = Buffer.concat([u32(8), Buffer.from("free")]);
    assert.equal(looksLikeMp4(ftyp, junkTail), false);
  });

  test("known limitation: a tail slice containing 'moov' bytes still requires a real ftyp box in the head — a moov-less head is always rejected regardless of tail content", () => {
    const noFtyp = Buffer.concat([u32(8), Buffer.from("free")]);
    const tailWithMoovBytes = Buffer.from("moov"); // not a real box, just the bytes
    assert.equal(looksLikeMp4(noFtyp, tailWithMoovBytes), false);
  });

  test("tail probe finds moov even when the tail slice starts mid-box (not box-boundary-aligned, as a real byte-range probe would be)", () => {
    const ftyp = Buffer.concat([u32(16), Buffer.from("ftyp"), Buffer.alloc(8)]);
    const moov = Buffer.concat([u32(8), Buffer.from("moov")]);
    // Simulate a tail slice cut from the middle of a preceding box's body.
    const misaligned = Buffer.concat([Buffer.alloc(13, 0), moov]);
    assert.equal(looksLikeMp4(ftyp, misaligned), true);
  });

  test("rejects arbitrary non-container bytes", () => {
    assert.equal(looksLikeMp4(Buffer.from("just some random bytes here")), false);
  });
});

describe("looksLikeWebm", () => {
  test("accepts EBML magic followed by a Segment element id", () => {
    const ebml = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
    const segment = Buffer.from([0x18, 0x53, 0x80, 0x67]);
    assert.equal(looksLikeWebm(Buffer.concat([ebml, Buffer.alloc(4), segment])), true);
  });

  test("rejects a file without the EBML magic", () => {
    assert.equal(looksLikeWebm(Buffer.alloc(16)), false);
  });

  test("rejects EBML magic with no Segment element following", () => {
    const ebml = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
    assert.equal(looksLikeWebm(Buffer.concat([ebml, Buffer.alloc(16)])), false);
  });
});
