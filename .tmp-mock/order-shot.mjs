// Usage: node order-shot.mjs <outDir> <slug> [orderId]
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [outDir, slug, existing] = process.argv.slice(2);
const base = "http://localhost:3100";
mkdirSync(outDir, { recursive: true });
const port = Number(process.env.PORT_CDP || 9334);
const chrome = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "oshot-"))}`,
    "--force-prefers-reduced-motion",
    "--hide-scrollbars",
    "--no-first-run",
    "about:blank",
  ],
  { stdio: "ignore" },
);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: "PUT" });
      return await res.json();
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
    send: (method, params = {}) =>
      new Promise((resolve) => {
        const n = ++id;
        pending.set(n, resolve);
        ws.send(JSON.stringify({ id: n, method, params }));
      }),
    once: (method) => new Promise((resolve) => listeners.push((m) => m.method === method && resolve(m))),
  };
}

// A tiny PNG so the receipt preview has something to show.
const RECEIPT =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAKCAYAAACJ+BM4AAAAKElEQVR4nGP8//8/AzJgYmBg+M+ABpgYcAAWJgYsAKwAqwJUQ4QUAQAx7gX1h6o3VwAAAABJRU5ErkJggg==";

const setup = `(async () => {
  const j = (path, body) => fetch('/backend' + path, { method: 'POST', credentials: 'include', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }).then(async r => ({ status: r.status, body: await r.json().catch(() => null) }));
  const email = 'qa-track-' + Date.now() + '@example.com';
  const reg = await j('/auth/register', { name: 'مهدیه نوروزی', email, password: 'password123' });
  const cart = await j('/cart/items', { slug: ${JSON.stringify(slug)} });
  const v = '2026-09-27';
  const order = await j('/orders', { name: 'مهدیه نوروزی', city: 'تهران', phone: '09120000000', address: 'سازمان برنامه جنوبی، کوچه ۲۲ شرقی، پلاک ۹، واحد ۳، کد پستی ۱۴۸۴۹۳۱۸۷۳', acceptedPolicies: { buying: v, shipping: v, returns: v, terms: v, privacy: v } });
  const id = order.body?.id;
  const cv = Object.assign(document.createElement('canvas'), { width: 240, height: 320 });
  const g = cv.getContext('2d');
  g.fillStyle = '#fbf8f2'; g.fillRect(0, 0, 240, 320);
  g.fillStyle = '#263d34'; g.fillRect(24, 28, 120, 14);
  g.fillStyle = '#cfc4b2'; for (let y = 70; y < 260; y += 26) g.fillRect(24, y, 150 + Math.random() * 40, 8);
  g.fillStyle = '#8a4938'; g.font = '14px sans-serif'; g.fillText(String(Date.now()), 24, 296);
  const paid = id && !${JSON.stringify(!!process.env.UNPAID)} ? await j('/orders/' + id + '/confirm-payment', { receiptImage: cv.toDataURL('image/png'), trackingNumber: String(Date.now()).slice(-10) }) : null;
  return JSON.stringify({ reg: reg.status, cart: cart.status, order: order.status, orderBody: id ? undefined : order.body, id, paid: paid?.status, paidBody: paid && paid.status >= 400 ? paid.body : undefined });
})()`;

try {
  const t = await target();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  const c = client(ws);
  await c.send("Page.enable");
  await c.send("Runtime.enable");
  let loaded = c.once("Page.loadEventFired");
  await c.send("Page.navigate", { url: `${base}/help` });
  await Promise.race([loaded, sleep(60000)]);
  let id = existing;
  if (!id) {
    const { result } = await c.send("Runtime.evaluate", { expression: setup, awaitPromise: true, returnByValue: true });
    console.log("setup", result.result.value ?? JSON.stringify(result));
    id = JSON.parse(result.result.value).id;
  }
  if (!id) throw new Error("no order");
  for (const width of [390, 1440]) {
    await c.send("Emulation.setDeviceMetricsOverride", {
      width,
      height: width < 600 ? 844 : 900,
      deviceScaleFactor: width < 600 ? 2 : 1,
      mobile: width < 600,
    });
    loaded = c.once("Page.loadEventFired");
    await c.send("Page.navigate", { url: `${base}/orders/${id}${process.env.LANG_EN ? "?lang=en" : ""}` });
    await Promise.race([loaded, sleep(60000)]);
    await sleep(4000);
    const { result } = await c.send("Runtime.evaluate", {
      expression:
        "JSON.stringify({h: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})",
      returnByValue: true,
    });
    const m = JSON.parse(result.result.value);
    console.log(width, m);
    const seg = width < 600 ? 1300 : 1100;
    for (let y = 0, i = 0; y < m.h; y += seg, i++) {
      const shot = await c.send("Page.captureScreenshot", {
        format: "jpeg",
        quality: 72,
        captureBeyondViewport: true,
        clip: { x: 0, y, width, height: Math.min(seg, m.h - y), scale: width < 600 ? 1 : 0.75 },
      });
      if (shot.result) writeFileSync(join(outDir, `${width}-${i}.jpg`), Buffer.from(shot.result.data, "base64"));
    }
  }
  console.log("order", id);
  ws.close();
} finally {
  chrome.kill();
}
