// Usage: node cdp-png.mjs <out.png>  — decodes the newest CDP captureScreenshot response.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
const dir = join(homedir(), ".cursor/browser-logs");
const latest = readdirSync(dir)
  .filter((f) => f.startsWith("cdp-response-Page.captureScreenshot"))
  .map((f) => join(dir, f))
  .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
const json = JSON.parse(readFileSync(latest, "utf8"));
writeFileSync(process.argv[2], Buffer.from(json.data ?? json.result?.data, "base64"));
console.log(process.argv[2]);
