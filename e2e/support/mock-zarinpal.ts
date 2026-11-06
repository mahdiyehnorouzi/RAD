/**
 * A controlled test double for ZarinPal (RAD-134). Implements just enough
 * of the real gateway's shape — `request.json`, `verify.json`, and the
 * `StartPay` redirect page — for the storefront's existing gateway-payment
 * UI (`checkout-payment.tsx`) to drive it unmodified. Never talks to any
 * real ZarinPal host; the API is pointed here via `ZARINPAL_BASE_URL`
 * (apps/api/src/payment/zarinpal.adapter.ts), which refuses anything but a
 * loopback URL and refuses it outright in production.
 *
 * Per-order behavior (success / NOK / verify error) is set in advance by a
 * test via `setOutcome`, then driven by what the simulated gateway page
 * actually does when a test clicks "Pay" or "Cancel" on it.
 */
import { createServer, type Server } from "node:http";
import { randomUUID } from "node:crypto";

export type GatewayOutcome =
  /** StartPay shows Pay/Cancel; whichever the test clicks decides Status=OK/NOK. */
  | "interactive"
  /** verify.json fails every call (simulates "gateway unreachable"). */
  | "verify_error"
  /** request.json fails exactly once, then behaves like "interactive". */
  | "request_down_once";

interface Session {
  authority: string;
  orderId: string;
  amountToman: number;
  callbackUrl: string;
  outcome: GatewayOutcome;
  /** Set once the simulated StartPay page is "paid" (Status=OK was issued). */
  paid: boolean;
  /** code 100 the first verify, code 101 (idempotent) every call after. */
  verifiedOnce: boolean;
  requestFailedOnce: boolean;
}

export class MockZarinpalGateway {
  private server: Server | undefined;
  private readonly sessionsByAuthority = new Map<string, Session>();
  private readonly pendingOutcomeByOrder = new Map<string, GatewayOutcome>();
  port = 0;

  /** Call before checkout() for this order to control what the gateway does. */
  setOutcome(orderId: string, outcome: GatewayOutcome) {
    this.pendingOutcomeByOrder.set(orderId, outcome);
  }

  get baseUrl() {
    return `http://127.0.0.1:${this.port}`;
  }

  async start(): Promise<void> {
    this.server = createServer((req, res) => {
      void this.handle(req, res).catch((error) => {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ data: {}, errors: { message: String(error) } }));
      });
    });
    await new Promise<void>((resolve) => {
      this.server!.listen(0, "127.0.0.1", resolve);
    });
    const address = this.server.address();
    this.port = typeof address === "object" && address ? address.port : 0;
  }

  async stop(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      if (!this.server) return resolve();
      this.server.close((err) => (err ? reject(err) : resolve()));
    });
  }

  private async handle(
    req: import("node:http").IncomingMessage,
    res: import("node:http").ServerResponse,
  ) {
    const url = new URL(req.url ?? "/", this.baseUrl);

    if (req.method === "POST" && url.pathname === "/pg/v4/payment/request.json") {
      const body = (await readJson(req)) as {
        amount: number;
        callback_url: string;
        metadata?: { order_id?: string };
      };
      return this.handleRequest(body, res);
    }
    if (req.method === "POST" && url.pathname === "/pg/v4/payment/verify.json") {
      const body = (await readJson(req)) as { authority: string };
      return this.handleVerify(body, res);
    }
    // Test-only control endpoint: lets a Playwright spec (a separate
    // process from this server) set the outcome for an order before
    // driving checkout through the browser. Never reachable in production
    // (this whole server only exists inside the local E2E harness).
    if (req.method === "POST" && url.pathname === "/test/outcomes") {
      const body = (await readJson(req)) as {
        orderId: string;
        outcome: GatewayOutcome;
      };
      this.setOutcome(body.orderId, body.outcome);
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method === "GET" && url.pathname.startsWith("/pg/StartPay/")) {
      const authority = decodeURIComponent(
        url.pathname.slice("/pg/StartPay/".length),
      );
      return this.handleStartPay(authority, res);
    }
    if (req.method === "GET" && url.pathname.startsWith("/pg/mark-paid/")) {
      const authority = decodeURIComponent(
        url.pathname.slice("/pg/mark-paid/".length),
      );
      return this.handleMarkPaid(authority, res);
    }
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ data: {}, errors: { message: "not found" } }));
  }

  private handleRequest(
    body: { amount: number; callback_url: string; metadata?: { order_id?: string } },
    res: import("node:http").ServerResponse,
  ) {
    const orderId = body.metadata?.order_id ?? "";
    const outcome = this.pendingOutcomeByOrder.get(orderId) ?? "interactive";

    if (outcome === "request_down_once") {
      const existing = [...this.sessionsByAuthority.values()].find(
        (s) => s.orderId === orderId,
      );
      if (!existing?.requestFailedOnce) {
        // Simulate a transient gateway outage on the FIRST attempt only.
        const authority = `TMP-${randomUUID()}`;
        this.sessionsByAuthority.set(authority, {
          authority,
          orderId,
          amountToman: body.amount,
          callbackUrl: body.callback_url,
          outcome,
          paid: false,
          verifiedOnce: false,
          requestFailedOnce: true,
        });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            data: {},
            errors: { code: -1, message: "ارتباط با درگاه پرداخت برقرار نشد (شبیه‌سازی‌شده)." },
          }),
        );
        return;
      }
    }

    const authority = `S${randomUUID().replace(/-/g, "")}`;
    this.sessionsByAuthority.set(authority, {
      authority,
      orderId,
      amountToman: body.amount,
      callbackUrl: body.callback_url,
      outcome,
      paid: false,
      verifiedOnce: false,
      requestFailedOnce: outcome === "request_down_once",
    });
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ data: { code: 100, message: "Success", authority }, errors: [] }));
  }

  private handleVerify(
    body: { authority: string },
    res: import("node:http").ServerResponse,
  ) {
    const session = this.sessionsByAuthority.get(body.authority);
    if (!session) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({ data: {}, errors: { code: -50, message: "Authority نامعتبر است." } }),
      );
      return;
    }
    // Re-check the LIVE outcome for this order, not just the one frozen on
    // the session at request.json time: a test only learns the real order
    // id after checkout() already called request.json, so `setOutcome` is
    // commonly called between request.json and verify.json for the same
    // order — it must still take effect.
    const liveOutcome = this.pendingOutcomeByOrder.get(session.orderId) ?? session.outcome;
    if (liveOutcome === "verify_error") {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data: {}, errors: { message: "simulated gateway outage" } }));
      return;
    }
    if (!session.paid) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          data: {},
          errors: { code: -51, message: "Session is not active paid try." },
        }),
      );
      return;
    }
    const code = session.verifiedOnce ? 101 : 100;
    session.verifiedOnce = true;
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        data: { code, message: "Success", ref_id: 123456, card_pan: "602137******1234" },
        errors: [],
      }),
    );
  }

  /** The simulated gateway page a Playwright test actually clicks through. */
  private handleStartPay(authority: string, res: import("node:http").ServerResponse) {
    const session = this.sessionsByAuthority.get(authority);
    if (!session) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<h1>Unknown authority</h1>");
      return;
    }
    // "Pay" goes through this server's own mark-paid route first (which then
    // 302s to the real callback URL) so the session is marked paid BEFORE
    // the browser ever reaches the callback — no client-side race.
    const payUrl = `/pg/mark-paid/${encodeURIComponent(authority)}`;
    const cancelUrl = `${session.callbackUrl}${session.callbackUrl.includes("?") ? "&" : "?"}Authority=${encodeURIComponent(authority)}&Status=NOK`;
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!doctype html>
<html>
  <body>
    <h1>Mock ZarinPal — ${session.amountToman} toman</h1>
    <a href="${payUrl}" id="mock-pay">Pay</a>
    <a href="${cancelUrl}" id="mock-cancel">Cancel</a>
  </body>
</html>`);
  }

  private handleMarkPaid(authority: string, res: import("node:http").ServerResponse) {
    const session = this.sessionsByAuthority.get(authority);
    if (!session) {
      res.writeHead(404, { "Content-Type": "text/html" });
      res.end("<h1>Unknown authority</h1>");
      return;
    }
    session.paid = true;
    const callback = `${session.callbackUrl}${session.callbackUrl.includes("?") ? "&" : "?"}Authority=${encodeURIComponent(authority)}&Status=OK`;
    res.writeHead(302, { Location: callback });
    res.end();
  }
}

function readJson(req: import("node:http").IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}
