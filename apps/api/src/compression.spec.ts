import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import compressionMiddleware from "compression";
import type { Request, Response, NextFunction } from "express";

/**
 * Verifies the exact default behavior app.use(compression()) relies on in
 * main.ts, without booting the full Nest/TypeORM app (no DB needed): small
 * bodies and already-encoded responses must be left alone, so turning this
 * on does not add gzip overhead where it cannot help.
 */
function startServer(handler: http.RequestListener): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const compress = compressionMiddleware();
    const server = http.createServer((req, res) => {
      compress(req as unknown as Request, res as unknown as Response, (() =>
        handler(req, res)) as NextFunction);
    });
    server.listen(0, () => {
      const { port } = server.address() as { port: number };
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

test("compression leaves a small JSON response uncompressed (below the default 1KB threshold)", async () => {
  const { url, close } = await startServer((_req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ ok: true }));
  });
  try {
    const response = await fetch(url, { headers: { "accept-encoding": "gzip, br" } });
    assert.equal(response.headers.get("content-encoding"), null);
  } finally {
    await close();
  }
});

test("compression gzips a large JSON response when the client accepts it", async () => {
  const bigPayload = JSON.stringify({ items: Array.from({ length: 2000 }, (_, i) => ({ id: i, name: "artwork" })) });
  const { url, close } = await startServer((_req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(bigPayload);
  });
  try {
    const response = await fetch(url, { headers: { "accept-encoding": "gzip, br" } });
    assert.ok(
      response.headers.get("content-encoding") === "gzip" ||
        response.headers.get("content-encoding") === "br",
    );
    const body = await response.text();
    assert.equal(JSON.parse(body).items.length, 2000);
  } finally {
    await close();
  }
});

test("compression does not double-compress a response that already set its own Content-Encoding", async () => {
  const { url, close } = await startServer((_req, res) => {
    res.setHeader("content-type", "application/octet-stream");
    res.setHeader("content-encoding", "br");
    res.end(Buffer.from([1, 2, 3, 4]));
  });
  try {
    const response = await fetch(url, { headers: { "accept-encoding": "gzip, br" } });
    assert.equal(response.headers.get("content-encoding"), "br");
  } finally {
    await close();
  }
});

test("compression is skipped entirely when the client sends no Accept-Encoding", async () => {
  const bigPayload = JSON.stringify({ items: Array.from({ length: 2000 }, (_, i) => i) });
  const { url, close } = await startServer((_req, res) => {
    res.setHeader("content-type", "application/json");
    res.end(bigPayload);
  });
  try {
    const response = await fetch(url, { headers: { "accept-encoding": "identity" } });
    assert.equal(response.headers.get("content-encoding"), null);
  } finally {
    await close();
  }
});
