import { LOCALE_COOKIE, LOCALE_QUERY, isLocale } from "@/lib/locale";
import { formatRadCode, parseRadNumber, type Locale } from "@rad/types";
import { identityHoldDocument } from "@/lib/identity/hold-document";
import {
  fetchPublicIdentity,
  IdentityUnreachableError,
} from "@/lib/identity/fetch";
import { planIdentityRequest } from "@/lib/identity/plan";

type RouteContext = { params: Promise<{ code: string }> };

const NO_STORE = { "cache-control": "no-store", "x-robots-tag": "noindex" };

function localeOf(request: Request): Locale {
  const url = new URL(request.url);
  const query = url.searchParams.get(LOCALE_QUERY);
  if (isLocale(query)) return query;
  const cookie = request.headers.get("cookie") ?? "";
  const saved = cookie.match(new RegExp(`${LOCALE_COOKIE}=(fa|en)`))?.[1];
  return isLocale(saved) ? saved : "fa";
}

/**
 * Permanent QR destination (`/r/084`). Redirects are temporary and uncached
 * so a later story publication is visible without reprinting the tag.
 */
export async function GET(request: Request, context: RouteContext) {
  const { code } = await context.params;
  const url = new URL(request.url);
  const search = url.search;
  const radNumber = /^\d+$/.test(code) ? parseRadNumber(code) : null;
  if (!radNumber) {
    return new Response("Not found", { status: 404, headers: NO_STORE });
  }
  const canonical = formatRadCode(radNumber);
  if (code !== canonical) {
    return new Response(null, {
      status: 307,
      headers: {
        ...NO_STORE,
        location: new URL(`/r/${canonical}${search}`, request.url).toString(),
      },
    });
  }

  let lookup: Parameters<typeof planIdentityRequest>[0]["lookup"];
  try {
    const identity = await fetchPublicIdentity(code);
    lookup = identity ? { kind: "found", identity } : { kind: "missing" };
  } catch (error) {
    if (!(error instanceof IdentityUnreachableError)) throw error;
    lookup = { kind: "unreachable" };
  }

  const plan = planIdentityRequest({ code, search, lookup });
  if (plan.status === 307) {
    return new Response(null, {
      status: 307,
      headers: {
        ...NO_STORE,
        location: new URL(plan.location, request.url).toString(),
      },
    });
  }
  if (plan.status === 404) {
    return new Response("Not found", { status: 404, headers: NO_STORE });
  }
  if (plan.status === 503 || lookup.kind === "unreachable") {
    const html = identityHoldDocument({
      locale: localeOf(request),
      unavailable: true,
      identity: {
        radNumber: 0,
        code: "000",
        status: "reserved",
        storyPublished: false,
        passportPath: null,
      },
    });
    return new Response(html, {
      status: 503,
      headers: { ...NO_STORE, "content-type": "text/html; charset=utf-8" },
    });
  }
  const html = identityHoldDocument({
    identity: plan.identity,
    locale: localeOf(request),
  });
  return new Response(html, {
    status: 200,
    headers: { ...NO_STORE, "content-type": "text/html; charset=utf-8" },
  });
}
