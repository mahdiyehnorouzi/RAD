// Usage: node account-shots.mjs <outDir> <base> <width> [locale] [pages...]
// Signs in the QA account, then screenshots each profile tab down to the footer.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [outDir, base, w, locale = "fa", ...only] = process.argv.slice(2);
const width = Number(w);
const q = locale === "en" ? "?lang=en" : "";
const pages = only.length
  ? only
  : ["/account", "/orders", "/account/making", "/favorites", "/account/notifications", "/account/info"];
mkdirSync(outDir, { recursive: true });
const port = 9400 + Math.floor(Math.random() * 500);
const chrome = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ["--headless=new", `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), "acc-"))}`, "--hide-scrollbars", "--no-first-run", "about:blank"],
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
  await c.send("Emulation.setDeviceMetricsOverride", { width, height: mobile ? 844 : 900, deviceScaleFactor: 1, mobile });
  await c.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });

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
  const shot = async (name) => {
    await sleep(1800);
    if (process.env.EVAL) console.log(name, JSON.stringify(await evaluate(process.env.EVAL)));
    const footer = await evaluate(
      "(() => { const f = document.querySelector('footer'); return f ? f.getBoundingClientRect().top + scrollY : document.documentElement.scrollHeight; })()",
    );
    const h = Math.ceil(footer);
    const seg = mobile ? 1400 : 1100;
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
  await sleep(1200);
  console.log(
    "login",
    await evaluate(
      `fetch('/backend/auth/session',{method:'POST',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:'qa.profile@rad.test',password:'QaProfile!2026'})}).then(r=>r.status)`,
    ),
  );
  for (const path of pages) {
    await go(`${base}${path}${q}`);
    await shot(path.replace(/^\//, "").replace(/\//g, "-"));
  }
  ws.close();
} finally {
  chrome.kill();
}
