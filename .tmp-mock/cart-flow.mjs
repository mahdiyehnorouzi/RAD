// Usage: node cart-flow.mjs <outDir> <base> <width> <slugA> <slugB> [en]
// Screenshots the bag with one work, two works, and the released-works card.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [outDir, base, w, a, b, locale = "fa"] = process.argv.slice(2);
const width = Number(w);
const q = locale === "en" ? "?lang=en" : "";
mkdirSync(outDir, { recursive: true });
const port = 9400 + Math.floor(Math.random() * 500);
const chrome = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "cart-"))}`,
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
      new Promise((res) => {
        const n = ++id;
        pending.set(n, res);
        ws.send(JSON.stringify({ id: n, method, params }));
      }),
    once: (method) => new Promise((res) => listeners.push((m) => m.method === method && res(m))),
  };
}

try {
  const t = await target();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  const c = client(ws);
  await c.send("Page.enable");
  await c.send("Runtime.enable");
  const mobile = width < 600;
  await c.send("Emulation.setDeviceMetricsOverride", {
    width,
    height: mobile ? 844 : 900,
    deviceScaleFactor: 1,
    mobile,
  });

  const evaluate = async (expression) => {
    const r = await c.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) console.log("EVAL ERR", JSON.stringify(r.result.exceptionDetails).slice(0, 400));
    return r.result?.result?.value;
  };
  const go = async (url) => {
    const loaded = c.once("Page.loadEventFired");
    await c.send("Page.navigate", { url });
    await Promise.race([loaded, sleep(60000)]);
  };
  const waitFor = async (expr, ms = 30000) => {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (await evaluate(expr)) return true;
      await sleep(250);
    }
    console.log("timeout waiting for", expr);
    return false;
  };
  const shot = async (name) => {
    await sleep(1400);
    const footer = await evaluate(
      "(() => { const f = document.querySelector('footer'); return f ? f.getBoundingClientRect().top + scrollY : document.documentElement.scrollHeight; })()",
    );
    const h = Math.ceil(footer);
    const seg = mobile ? 1200 : 1000;
    for (let y = 0, i = 0; y < h; y += seg, i++) {
      const r = await c.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: true,
        clip: { x: 0, y, width, height: Math.min(seg, h - y), scale: 1 },
      });
      writeFileSync(join(outDir, `${name}-${i}.png`), Buffer.from(r.result.data, "base64"));
    }
    console.log("shot", name, h);
  };
  const addItem = (slug) =>
    evaluate(
      `fetch('/backend/cart/items',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug:${JSON.stringify(slug)}})}).then(r=>r.status)`,
    );
  const openBag = async () => {
    await go(`${base}/cart${q}`);
    await waitFor("!!document.querySelector('.cart-bag, .cart-empty .state-screen')");
  };

  await go(`${base}/${q}`);
  await sleep(1500);
  console.log("add", a, await addItem(a));
  await openBag();
  await shot("1-one");

  console.log("add", b, await addItem(b));
  await openBag();
  await shot("2-two");

  await evaluate("fetch('/backend/cart',{method:'DELETE',credentials:'include'}).then(r=>r.status)");
  await evaluate(
    `(() => { localStorage.setItem('rad-cart-known', '[]'); localStorage.setItem('rad-cart-released', JSON.stringify([${JSON.stringify(a)}, ${JSON.stringify(b)}])); return true; })()`,
  );
  await openBag();
  await shot("3-released-empty");

  console.log("add", a, await addItem(a));
  await evaluate(
    `(() => { localStorage.setItem('rad-cart-known', JSON.stringify([${JSON.stringify(a)}])); localStorage.setItem('rad-cart-released', JSON.stringify([${JSON.stringify(b)}])); return true; })()`,
  );
  await openBag();
  await shot("4-released-with-item");

  await evaluate("fetch('/backend/cart',{method:'DELETE',credentials:'include'}).then(r=>r.status)");
  ws.close();
} finally {
  chrome.kill();
}
