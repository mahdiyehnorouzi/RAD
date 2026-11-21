import {
  CANONICAL_RAD_ORIGIN,
  formatRadCode,
  radIdentityLabel,
  radPermanentUrl,
  type RadIdentityStatus,
} from "@rad/types";
import JSZip from "jszip";
import jsQR from "jsqr";
import { PNG } from "pngjs";
import QRCode from "qrcode";

const DARK = "#18231f";
const LIGHT = "#ffffff";
const MARGIN = 4;

export interface QrArtworkFile {
  radNumber: number;
  label: string;
  url: string;
  status: RadIdentityStatus;
  productId: string | null;
  productName: string | null;
  batchId: string | null;
  storyPublished: boolean;
}

export function qrGeometry(text: string) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "H" });
  const size = qr.modules.size;
  const data = qr.modules.data;
  let d = "";
  for (let y = 0; y < size; y += 1) {
    let x = 0;
    while (x < size) {
      if (!data[y * size + x]) {
        x += 1;
        continue;
      }
      const start = x;
      while (x < size && data[y * size + x]) x += 1;
      d += `M${start + MARGIN} ${y + MARGIN}h${x - start}v1h${start - x}z`;
    }
  }
  return { modules: size, dimension: size + MARGIN * 2, d };
}

export function qrSvg(text: string) {
  const { dimension, d } = qrGeometry(text);
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dimension} ${dimension}" shape-rendering="crispEdges">
  <rect width="100%" height="100%" fill="${LIGHT}"/>
  <path fill="${DARK}" d="${d}"/>
</svg>`;
  return { svg, dimension };
}

export async function qrPng(text: string) {
  return QRCode.toBuffer(text, {
    errorCorrectionLevel: "H",
    margin: MARGIN,
    width: 1024,
    color: { dark: DARK, light: LIGHT },
  });
}

export function decodePngQr(buffer: Buffer) {
  const png = PNG.sync.read(buffer);
  return (
    jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data ?? null
  );
}

export function decodeSvgQr(svg: string) {
  const viewBox = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  const path = svg.match(/<path[^>]* d="([^"]+)"/);
  if (!viewBox || !path) return null;
  const dimension = Number(viewBox[1]);
  const scale = 8;
  const width = dimension * scale;
  const pixels = new Uint8ClampedArray(width * width * 4);
  for (let i = 0; i < pixels.length; i += 4) {
    pixels[i] = 255;
    pixels[i + 1] = 255;
    pixels[i + 2] = 255;
    pixels[i + 3] = 255;
  }
  const command = /M(\d+) (\d+)h(\d+)v1h-(\d+)z/g;
  for (const match of path[1].matchAll(command)) {
    const x = Number(match[1]);
    const y = Number(match[2]);
    const run = Number(match[3]);
    for (let py = y * scale; py < (y + 1) * scale; py += 1) {
      for (let px = x * scale; px < (x + run) * scale; px += 1) {
        const index = (py * width + px) * 4;
        pixels[index] = 0x18;
        pixels[index + 1] = 0x23;
        pixels[index + 2] = 0x1f;
      }
    }
  }
  return jsQR(pixels, width, width)?.data ?? null;
}

function csvCell(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function csv(rows: Array<Array<string | number | null>>) {
  return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

export interface ArchiveVerification {
  ok: boolean;
  fileCount: number;
  failures: string[];
}

export async function buildIdentityArchive(rows: QrArtworkFile[]) {
  const zip = new JSZip();
  const svgFolder = zip.folder("SVG");
  const pngFolder = zip.folder("PNG");
  if (!svgFolder || !pngFolder) throw new Error("zip folders missing");
  const manifest: Array<Array<string | number | null>> = [
    [
      "radNumber",
      "label",
      "permanentUrl",
      "status",
      "productId",
      "productName",
      "batchId",
      "svg",
      "png",
    ],
  ];
  const report: Array<Array<string | number | null>> = [
    ["radNumber", "expectedUrl", "decodedSvg", "decodedPng", "ok", "detail"],
  ];
  const seenNumbers = new Set<number>();
  const seenNames = new Set<string>();
  const failures: string[] = [];

  for (const row of rows) {
    const url = radPermanentUrl(row.radNumber, CANONICAL_RAD_ORIGIN);
    const label = radIdentityLabel(row.radNumber);
    const svgName = `${label}.svg`;
    const pngName = `${label}.png`;
    if (seenNumbers.has(row.radNumber))
      failures.push(`duplicate number ${label}`);
    if (seenNames.has(svgName) || seenNames.has(pngName)) {
      failures.push(`duplicate filename ${label}`);
    }
    seenNumbers.add(row.radNumber);
    seenNames.add(svgName);
    seenNames.add(pngName);
    if (row.url !== url) failures.push(`url mismatch ${label}`);
    const { svg } = qrSvg(url);
    const png = await qrPng(url);
    svgFolder.file(svgName, svg);
    pngFolder.file(pngName, png);
    const decodedSvg = decodeSvgQr(svg);
    const decodedPng = decodePngQr(png);
    const ok = decodedSvg === url && decodedPng === url;
    if (!ok) failures.push(`decode mismatch ${label}`);
    manifest.push([
      row.radNumber,
      label,
      url,
      row.status,
      row.productId,
      row.productName,
      row.batchId,
      `SVG/${svgName}`,
      `PNG/${pngName}`,
    ]);
    report.push([
      row.radNumber,
      url,
      decodedSvg,
      decodedPng,
      ok ? "pass" : "fail",
      ok ? "" : "decoded payload does not match the canonical URL",
    ]);
  }

  if (manifest.length - 1 !== rows.length) {
    failures.push("manifest row count does not match the batch");
  }
  zip.file("manifest.csv", csv(manifest));
  zip.file("verification-report.csv", csv(report));
  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  const verification = await verifyIdentityArchive(buffer, rows);
  verification.failures.push(...failures);
  verification.ok = verification.ok && failures.length === 0;
  return { buffer, verification };
}

export async function verifyIdentityArchive(
  buffer: Buffer,
  expected: QrArtworkFile[],
): Promise<ArchiveVerification> {
  const zip = await JSZip.loadAsync(buffer);
  const failures: string[] = [];
  const svgNames = Object.keys(zip.files).filter(
    (name) => name.startsWith("SVG/") && !name.endsWith("/"),
  );
  const pngNames = Object.keys(zip.files).filter(
    (name) => name.startsWith("PNG/") && !name.endsWith("/"),
  );
  if (svgNames.length !== expected.length) {
    failures.push(`svg count ${svgNames.length} != ${expected.length}`);
  }
  if (pngNames.length !== expected.length) {
    failures.push(`png count ${pngNames.length} != ${expected.length}`);
  }
  const manifestFile = zip.file("manifest.csv");
  const reportFile = zip.file("verification-report.csv");
  if (!manifestFile || !reportFile) failures.push("missing csv");
  const seen = new Set<string>();
  for (const row of expected) {
    const label = radIdentityLabel(row.radNumber);
    const url = radPermanentUrl(row.radNumber);
    if (seen.has(label)) failures.push(`duplicate ${label}`);
    seen.add(label);
    const svgEntry = zip.file(`SVG/${label}.svg`);
    const pngEntry = zip.file(`PNG/${label}.png`);
    if (!svgEntry || !pngEntry) {
      failures.push(`missing file ${label}`);
      continue;
    }
    const decodedSvg = decodeSvgQr(await svgEntry.async("string"));
    const decodedPng = decodePngQr(await pngEntry.async("nodebuffer"));
    if (decodedSvg !== url || decodedPng !== url) {
      failures.push(`payload ${label}`);
    }
  }
  const numbers = [...expected.map((row) => row.radNumber)].sort(
    (a, b) => a - b,
  );
  for (let index = 1; index < numbers.length; index += 1) {
    if (numbers[index] === numbers[index - 1]) {
      failures.push(`duplicate number ${numbers[index]}`);
    }
  }
  return {
    ok: failures.length === 0,
    fileCount: svgNames.length + pngNames.length,
    failures,
  };
}

export interface PublicUrlCheck {
  radNumber: number;
  url: string;
  status: number;
  ok: boolean;
  detail: string;
}

export async function verifyPublicIdentityUrls(input: {
  rows: QrArtworkFile[];
  origin: string;
  fetchImpl?: typeof fetch;
}) {
  const fetchImpl = input.fetchImpl ?? fetch;
  const origin = input.origin.replace(/\/$/, "");
  const checks: PublicUrlCheck[] = [];
  for (const row of input.rows) {
    const code = formatRadCode(row.radNumber);
    const url = `${origin}/r/${code}`;
    try {
      const response = await fetchImpl(url, { redirect: "manual" });
      const location = response.headers.get("location") ?? "";
      const body = response.status === 200 ? await response.text() : "";
      const publishedOk =
        row.storyPublished &&
        (response.status === 307 || response.status === 302) &&
        location.includes(`/passport/${code}`);
      const placeholderOk =
        !row.storyPublished &&
        response.status === 200 &&
        body.includes(`data-rad-code="${code}"`);
      const ok = publishedOk || placeholderOk;
      checks.push({
        radNumber: row.radNumber,
        url,
        status: response.status,
        ok,
        detail: ok ? "ok" : "destination did not match this identity",
      });
    } catch {
      checks.push({
        radNumber: row.radNumber,
        url,
        status: 0,
        ok: false,
        detail: "unreachable",
      });
    }
  }
  return { ok: checks.every((check) => check.ok), checks };
}
