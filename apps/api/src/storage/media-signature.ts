/**
 * Server-side byte-signature inspection for product image/video uploads.
 *
 * This exists because S3-compatible storage (unlike Cloudinary's Admin
 * API) does not decode/transcode uploads and hand back verified
 * format/dimension metadata — `S3StorageService.verifyMedia` has to derive
 * that itself from the actual bytes, the same way `CloudinaryStorageService
 * .verifyMedia` trusts only what Cloudinary decoded, never the client's
 * claimed `Content-Type` or file extension.
 *
 * Deliberately dependency-free: these are well-documented, stable binary
 * container formats (PNG/JPEG/WebP headers, MP4/WebM box structure) that
 * don't need a general-purpose image/video decoding library — adding one
 * (e.g. `sharp`, which bundles native libvips binaries) for this narrow,
 * well-specified parsing job would be a disproportionate dependency for a
 * 2GB-RAM VPS. See `media-signature.spec.ts` for format fixtures,
 * including truncated/malformed/adversarial inputs.
 *
 * Scope, stated plainly: every function here does FORMAT IDENTIFICATION
 * and HEADER PARSING ONLY — reading a handful of fixed-position bytes a
 * container format's spec guarantees are there, never decoding pixel or
 * sample data. That is deliberately a much weaker guarantee than "this
 * file is a well-formed, fully decodable, safe-to-render image/video":
 * - A JPEG/PNG/WebP that passes `sniffImage` can still have a truncated or
 *   corrupt entropy-coded body past the header — nothing here decodes
 *   that far. A real decoder (e.g. a future thumbnailing step) can still
 *   fail or behave unexpectedly on such a file; this module does not
 *   protect against that, only against a file that isn't really an image
 *   at all (the actual threat `verifyMedia` exists to stop: Cloudinary
 *   used to decode-and-validate for us, S3 does not).
 * - A header-declared width/height is trusted as reported (bounded only by
 *   `media-policy.ts#MAX_IMAGE_DIMENSION_PX` at the call site) — it is not
 *   cross-checked against the actual pixel data length, so a file could in
 *   principle misreport its own dimensions within that bound.
 * - MP4/WebM validation (`looksLikeMp4`/`looksLikeWebm`) checks container
 *   *structure* only (expected top-level boxes/elements present) — not
 *   that the video track inside actually decodes, matches any particular
 *   codec, or is free of malformed sample data. See the limitation notes
 *   on each function below for specifics.
 */

export type SniffedImageFormat = "jpeg" | "png" | "webp";
export interface ImageSignature {
  format: SniffedImageFormat;
  width: number;
  height: number;
}

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function sniffPng(buffer: Buffer): ImageSignature | null {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(PNG_MAGIC)) return null;
  // IHDR is always the first chunk, immediately after the 8-byte signature:
  // 4-byte length, 4-byte "IHDR", 4-byte width, 4-byte height (big-endian).
  if (buffer.toString("ascii", 12, 16) !== "IHDR") return null;
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { format: "png", width, height };
}

/**
 * Walks JPEG markers after the SOI (FFD8) looking for a Start-Of-Frame
 * marker (any 0xC0-0xCF byte except the DHT/JPG/DAC family 0xC4/0xC8/0xCC),
 * whose payload carries height/width. Stops cleanly at SOS (start of scan
 * data) or on any structural inconsistency — returns null rather than
 * guessing, so an unparsable file is rejected, not half-trusted.
 */
function sniffJpeg(buffer: Buffer): ImageSignature | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return null;
  let pos = 2;
  let guard = 0;
  while (pos + 2 <= buffer.length) {
    // Bounds the loop independently of how far `pos` advances per
    // iteration — a defensive cap against any future change here
    // introducing a non-terminating edge case on adversarial input.
    if (++guard > 10_000) return null;
    if (buffer[pos] !== 0xff) return null;
    // 0xFF is a valid fill/padding byte between markers (JPEG spec,
    // T.81 B.1.1.2) — skip any run of them to find the real marker code,
    // rather than rejecting a spec-legal file as malformed.
    let markerPos = pos + 1;
    while (markerPos < buffer.length && buffer[markerPos] === 0xff) markerPos++;
    if (markerPos >= buffer.length) return null;
    const marker = buffer[markerPos];
    pos = markerPos - 1; // re-anchor to the 0xFF immediately before the real marker byte
    // Standalone markers with no length-prefixed payload.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) {
      if (marker === 0xd9 /* EOI */ || marker === 0xda /* SOS */) return null;
      pos += 2;
      continue;
    }
    if (pos + 4 > buffer.length) return null;
    const length = buffer.readUInt16BE(pos + 2);
    if (length < 2 || pos + 2 + length > buffer.length) return null;
    const isSof =
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc;
    if (isSof) {
      if (length < 7) return null;
      const height = buffer.readUInt16BE(pos + 5);
      const width = buffer.readUInt16BE(pos + 7);
      return { format: "jpeg", width, height };
    }
    if (marker === 0xda) return null; // SOS reached, no SOF seen first
    pos += 2 + length;
  }
  return null;
}

function sniffWebp(buffer: Buffer): ImageSignature | null {
  if (
    buffer.length < 30 ||
    buffer.toString("ascii", 0, 4) !== "RIFF" ||
    buffer.toString("ascii", 8, 12) !== "WEBP"
  )
    return null;
  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    // Lossy: 3-byte start code (0x9d 0x01 0x2a) at offset 23, then two
    // little-endian 14-bit dimensions (top 2 bits are a scaling flag).
    if (
      buffer.length < 30 ||
      buffer[23] !== 0x9d ||
      buffer[24] !== 0x01 ||
      buffer[25] !== 0x2a
    )
      return null;
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return { format: "webp", width, height };
  }
  if (chunk === "VP8L") {
    // Lossless: 1-byte signature (0x2f) then a packed 28-bit width-1/height-1 field.
    if (buffer.length < 25 || buffer[20] !== 0x2f) return null;
    const bits =
      buffer[21] | (buffer[22] << 8) | (buffer[23] << 16) | (buffer[24] << 24);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { format: "webp", width, height };
  }
  if (chunk === "VP8X") {
    // Extended format: canvas size is two 24-bit little-endian (size-1) values at offset 24.
    if (buffer.length < 30) return null;
    const width = (buffer[24] | (buffer[25] << 8) | (buffer[26] << 16)) + 1;
    const height = (buffer[27] | (buffer[28] << 8) | (buffer[29] << 16)) + 1;
    return { format: "webp", width, height };
  }
  return null;
}

/**
 * Identifies the real format and pixel dimensions from decoded header
 * bytes only — never from a filename, extension, or `Content-Type` the
 * client sent. Returns `null` for anything unrecognized/malformed, which
 * callers must treat as rejection, not a fallback guess.
 */
export function sniffImage(buffer: Buffer): ImageSignature | null {
  return sniffPng(buffer) ?? sniffJpeg(buffer) ?? sniffWebp(buffer);
}

export type SniffedVideoFormat = "mp4" | "webm";

interface Mp4Box {
  type: string;
  start: number;
  bodyStart: number;
  end: number;
}

/** Walks top-level ISO-BMFF boxes in `buffer`, tolerating a truncated final box (common when only a head/tail slice is available). */
function walkMp4Boxes(buffer: Buffer): Mp4Box[] {
  const boxes: Mp4Box[] = [];
  let pos = 0;
  while (pos + 8 <= buffer.length) {
    const size32 = buffer.readUInt32BE(pos);
    const type = buffer.toString("ascii", pos + 4, pos + 8);
    let bodyStart = pos + 8;
    let size = size32;
    if (size32 === 1) {
      if (pos + 16 > buffer.length) break; // 64-bit size header truncated
      const big = buffer.readBigUInt64BE(pos + 8);
      if (big > BigInt(Number.MAX_SAFE_INTEGER)) break;
      size = Number(big);
      bodyStart = pos + 16;
    } else if (size32 === 0) {
      size = buffer.length - pos; // box extends to end of what we have
    }
    if (!/^[\x20-\x7e]{4}$/.test(type) || size < 8) break;
    const end = pos + size;
    boxes.push({ type, start: pos, bodyStart, end: Math.min(end, buffer.length) });
    if (end > buffer.length) break; // box continues past this slice
    pos = end;
  }
  return boxes;
}

const MOOV_TYPE = Buffer.from("moov", "ascii");

/**
 * Structural (not full-decode) validation: a genuine MP4 starts with an
 * `ftyp` box, and a complete, playable file has a `moov` box somewhere
 * (either near the start — "fast start" — or, commonly for
 * camera/phone-recorded video, near the end after `mdat`). Callers pass
 * both a head slice and, if `moov` isn't in the head, a tail slice of the
 * same object so trailing-moov files aren't rejected as invalid.
 *
 * The head slice is walked as proper box structure (`walkMp4Boxes`, which
 * understands box-size framing) because it starts at a real box boundary
 * (byte 0 of the object). The tail slice is NOT box-boundary-aligned — it's
 * an arbitrary byte range taken from near the end of a potentially huge
 * file, almost certainly starting mid-box (inside `mdat`'s payload) — so it
 * cannot be walked the same way. Instead the tail is scanned for the
 * literal 4-byte `moov` type field as a substring. This is a heuristic
 * (a real `moov` type is also preceded by a 4-byte size field, not checked
 * here), accepted as a known limitation: it cannot be fooled into treating
 * a bogus file as valid *without* a real `ftyp` box also being present in
 * the head (which this function still always requires), and it never
 * rejects a real trailing-moov MP4 due to tail misalignment, which a
 * strict box walk would.
 */
export function looksLikeMp4(head: Buffer, tail?: Buffer): boolean {
  const headBoxes = walkMp4Boxes(head);
  if (!headBoxes.some((box) => box.type === "ftyp")) return false;
  if (headBoxes.some((box) => box.type === "moov")) return true;
  if (!tail) return false;
  return tail.includes(MOOV_TYPE);
}

const WEBM_EBML_MAGIC = Buffer.from([0x1a, 0x45, 0xdf, 0xa3]);
const WEBM_SEGMENT_ID = Buffer.from([0x18, 0x53, 0x80, 0x67]);

/**
 * Lighter-weight structural check for WebM/Matroska: verifies the EBML
 * header magic and that a top-level Segment element ID follows within the
 * same slice. This does not fully parse the EBML element tree (unlike the
 * MP4 box walk above) — see the module-level known-limitations note in
 * `s3-storage.service.ts`.
 */
export function looksLikeWebm(head: Buffer): boolean {
  if (head.length < 4 || !head.subarray(0, 4).equals(WEBM_EBML_MAGIC)) return false;
  return head.includes(WEBM_SEGMENT_ID, 4);
}
