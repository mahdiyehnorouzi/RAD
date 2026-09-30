// Usage: node bag-shot.mjs <outDir> <slug>
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [outDir, slug] = process.argv.slice(2);
const base = "http://localhost:3100";
mkdirSync(outDir, { recursive: true });
const port = 9338;
const chrome = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "bshot-"))}`, "--force-prefers-reduced-motion", "--hide-scrollbars", "--no-first-run", "about:blank"],
  { stdio: "ignore" },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function target() {
  for (let i = 0; i < 50; i++) {
    try {
      return await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" })).json();
    } catch {
      await sleep(200);
    }
  }
  throw new Error("chrome did not start");
}
function client(ws) {
  let id = 0;
  const pending = new Map();
  const listeners = [];
  ws.onmessage = (e) => {
    const msg = JSON.parse(e.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    } else listeners.forEach((fn) => fn(msg));
  };
  return {
    send: (method, params = {}) => new Promise((resolve) => { const n = ++id; pending.set(n, resolve); ws.send(JSON.stringify({ id: n, method, params })); }),
    once: (method) => new Promise((resolve) => listeners.push((m) => m.method === method && resolve(m))),
  };
}

try {
  const t = await target();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  const c = client(ws);
  await c.send("Page.enable");
  await c.send("Runtime.enable");
  await c.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  let loaded = c.once("Page.loadEventFired");
  await c.send("Page.navigate", { url: `${base}/help` });
  await Promise.race([loaded, sleep(60000)]);
  const { result } = await c.send("Runtime.evaluate", {
    expression: `(async () => {
      const j = (p, b) => fetch('/backend' + p, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }).then(r => r.status);
      return [await j('/auth/register', { name: 'QA', email: 'qa-bag-' + Date.now() + '@example.com', password: 'password123' }), await j('/cart/items', { slug: ${JSON.stringify(slug)} })].join(',');
    })()`,
    awaitPromise: true,
    returnByValue: true,
  });
  console.log("setup", result.result.value);
  for (const lang of ["", "?lang=en"]) {
    loaded = c.once("Page.loadEventFired");
    await c.send("Page.navigate", { url: `${base}/products/${slug}${lang}` });
    await Promise.race([loaded, sleep(60000)]);
    await sleep(4000);
    const box = await c.send("Runtime.evaluate", {
      expression: "(() => { const el = document.querySelector('.pdp-buy'); el.scrollIntoView({block:'center'}); const b = el.getBoundingClientRect(); return JSON.stringify({x: b.left + scrollX, y: b.top + scrollY, w: b.width, h: b.height, sw: document.documentElement.scrollWidth}); })()",
      returnByValue: true,
    });
    const b = JSON.parse(box.result.result.value);
    console.log(lang || "fa", b);
    await sleep(600);
    const shot = await c.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true, clip: { x: b.x - 12, y: b.y - 60, width: b.w + 24, height: b.h + 150, scale: 1 } });
    writeFileSync(join(outDir, `buy${lang ? "-en" : "-fa"}.png`), Buffer.from(shot.result.data, "base64"));
  }
  ws.close();
} finally {
  chrome.kill();
}
