// Usage: node shoot.mjs <outDir> <name>=<url>@<width> ...
import { spawn } from "node:child_process";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [outDir, ...jobs] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const port = 9333;
const chrome = spawn(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${mkdtempSync(join(tmpdir(), "shoot-"))}`,
    ...(process.env.MOTION ? [] : ["--force-prefers-reduced-motion"]),
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

try {
  const t = await target();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  const c = client(ws);
  await c.send("Page.enable");
  await c.send("Runtime.enable");
  for (const job of jobs) {
    const name = job.slice(0, job.indexOf("="));
    const rest = job.slice(job.indexOf("=") + 1);
    const [url, w] = rest.split("@");
    const width = Number(w);
    const height = width < 600 ? 844 : 900;
    await c.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: width < 600 ? 2 : 1,
      mobile: width < 600,
    });
    const loaded = c.once("Page.loadEventFired");
    await c.send("Page.navigate", { url });
    await Promise.race([loaded, sleep(60000)]);
    await sleep(2500);
    await c.send("Runtime.evaluate", {
      expression:
        "(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); } scrollTo(0, 0); })()",
      awaitPromise: true,
    });
    await sleep(2500);
    const { result } = await c.send("Runtime.evaluate", {
      expression:
        "JSON.stringify({h: document.documentElement.scrollHeight, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth})",
      returnByValue: true,
    });
    const m = JSON.parse(result.result.value);
    console.log(name, m);
    if (process.env.EVAL) {
      const probe = await c.send("Runtime.evaluate", { expression: process.env.EVAL, returnByValue: true, awaitPromise: true });
      console.log(name, "EVAL", JSON.stringify(probe.result.result.value ?? probe.result));
      if (process.env.NOSHOT) continue;
    }
    const vh = width < 600 ? 844 : 900;
    const stops = (process.env.STOPS || "0").split(",").map(Number);
    for (const [i, y] of stops.entries()) {
      await c.send("Runtime.evaluate", { expression: `scrollTo(0, ${y})` });
      await sleep(900);
      const shot = await c.send("Page.captureScreenshot", { format: "jpeg", quality: 70 });
      writeFileSync(join(outDir, `${name}-vp${i}.jpg`), Buffer.from(shot.result.data, "base64"));
    }
  }
  ws.close();
} finally {
  chrome.kill();
}
