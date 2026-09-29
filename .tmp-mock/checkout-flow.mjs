// Usage: node checkout-flow.mjs <outDir> <base> <slug> <width>
// Walks bag → details → payment → receipt → result and screenshots each step.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const [outDir, base, slug, w, locale = "fa"] = process.argv.slice(2);
const width = Number(w);
const q = locale === "en" ? "?lang=en" : "";
mkdirSync(outDir, { recursive: true });
const port = 9400 + Math.floor(Math.random() * 500);
const chrome = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "flow-"))}`,
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
  await c.send("DOM.enable");
  const mobile = width < 600;
  const metrics = (height) =>
    c.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile,
    });
  await metrics(mobile ? 844 : 900);

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
    await sleep(600);
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

  await go(`${base}/${q}`);
  await sleep(1500);
  console.log(
    "add",
    await evaluate(
      `fetch('/backend/cart/items',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({slug:${JSON.stringify(slug)}})}).then(r=>r.status)`,
    ),
  );

  await go(`${base}/checkout${q}`);
  await waitFor("!!document.querySelector('#checkout-details')");
  await shot("1-details");

  // Submit empty to show field errors.
  await evaluate("document.querySelector('.checkout-submit').click()");
  await sleep(400);
  await evaluate("scrollTo(0,0)");
  await shot("1b-details-errors");

  await evaluate(`(() => {
    const set = (sel, v) => { const el = document.querySelector(sel); const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, v); el.dispatchEvent(new Event('input', {bubbles:true})); };
    set('#checkout-name', 'مهدیه نوروزی');
    set('#checkout-phone', '۰۹۱۲۱۲۳۴۵۶۷');
    set('#checkout-city', 'تهران');
    set('#checkout-address', 'خیابان ولیعصر، کوچه‌ی بهار، پلاک ۴۲، واحد ۳');
    set('#checkout-postal', '1234567890');
    const box = document.querySelector('.checkout-agree input'); if (!box.checked) box.click();
    return true;
  })()`);
  await sleep(300);
  await evaluate("document.querySelector('.checkout-submit').click()");
  await waitFor("location.pathname.startsWith('/checkout/') && !!document.querySelector('.payment-card, .checkout-pay')", 30000);
  await waitFor("!!document.querySelector('.payment-card')", 10000);
  console.log("url", await evaluate("location.href"));
  const alert = await evaluate("document.querySelector('.checkout-alert')?.textContent || ''");
  if (alert) console.log("alert", alert);
  await shot("2-payment");

  const { result: doc } = await c.send("DOM.getDocument", { depth: -1 });
  const { result: input } = await c.send("DOM.querySelector", { nodeId: doc.root.nodeId, selector: ".payment-drop-input" });
  if (input?.nodeId) {
    await c.send("DOM.setFileInputFiles", {
      nodeId: input.nodeId,
      files: [resolve(process.env.RECEIPT ?? "apps/storefront/public/states/empty-bag.jpg")],
    });
  }
  await sleep(600);
  await evaluate(`(() => { const el = document.querySelector('.payment-receipt input[type=text]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '${String(Date.now()).slice(-8)}'); el.dispatchEvent(new Event('input', {bubbles:true})); return true; })()`);
  await sleep(300);
  await shot("2b-payment-filled");

  await evaluate("document.querySelector('.checkout-flow-action .checkout-submit').click()");
  await waitFor("!!document.querySelector('.payment-result')", 30000);
  await evaluate("scrollTo(0,0)");
  await shot("3-result");
  ws.close();
} finally {
  chrome.kill();
}
