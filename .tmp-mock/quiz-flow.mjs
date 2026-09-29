// Usage: node quiz-flow.mjs <outDir> <base> <width> [fa|en]
// Walks the shape quiz: step 1, step 1 picked, step 3 picked, results; one full-page shot each.
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [outDir, base, w, locale = "fa"] = process.argv.slice(2);
const width = Number(w);
const q = locale === "en" ? "?lang=en" : "";
mkdirSync(outDir, { recursive: true });
const port = 9400 + Math.floor(Math.random() * 500);
const chrome = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "quiz-"))}`,
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
  await c.send("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: "reduce" }],
  });

  const evaluate = async (expression) => {
    const r = await c.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) console.log("EVAL ERR", JSON.stringify(r.result.exceptionDetails).slice(0, 400));
    return r.result?.result?.value;
  };
  const shot = async (name) => {
    await evaluate("scrollTo(0,0)");
    await sleep(900);
    const h = await evaluate(
      "(() => { const f = document.querySelector('footer'); return Math.ceil((f ? f.getBoundingClientRect().top + scrollY + 120 : document.documentElement.scrollHeight)); })()",
    );
    const r = await c.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width, height: h, scale: 1 },
    });
    writeFileSync(join(outDir, `${name}.png`), Buffer.from(r.result.data, "base64"));
    console.log("shot", name, h);
  };
  const click = (sel) => evaluate(`document.querySelector(${JSON.stringify(sel)})?.click()`);

  const loaded = c.once("Page.loadEventFired");
  await c.send("Page.navigate", { url: `${base}/shape${q}` });
  await Promise.race([loaded, sleep(60000)]);
  await sleep(2500);
  await shot("1-step");

  await click(".sq-choice:nth-child(1) input");
  await shot("1b-picked");

  await click(".sq-next");
  await sleep(300);
  await click(".sq-choice:nth-child(2) input");
  await click(".sq-next");
  await sleep(300);
  await click(".sq-choice:nth-child(2) input");
  await shot("3-picked");

  await click(".sq-next");
  await sleep(300);
  await click(".sq-choice:nth-child(1) input");
  await click(".sq-next");
  await sleep(300);
  await click(".sq-choice:nth-child(2) input");
  await shot("5-picked");
  await click(".sq-next");
  await sleep(1200);
  await shot("6-result");
  console.log("focus", await evaluate("document.activeElement?.tagName + ' ' + document.activeElement?.textContent"));
  ws.close();
} finally {
  chrome.kill();
}
