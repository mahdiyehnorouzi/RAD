import { NextResponse, type NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_QUERY,
  isLocale,
} from "@/lib/locale";

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const [, firstSegment] = pathname.split("/");

  // Already rewritten: the proxy also sees the internal `/fa/...` URL it produced.
  if (isLocale(firstSegment)) return NextResponse.next();

  const requested = searchParams.get(LOCALE_QUERY);
  const saved = request.cookies.get(LOCALE_COOKIE)?.value;

  // A visitor who chose English keeps it on links that carry no `lang`.
  if (!isLocale(requested) && isLocale(saved) && saved !== DEFAULT_LOCALE) {
    const url = request.nextUrl.clone();
    url.searchParams.set(LOCALE_QUERY, saved);
    return NextResponse.redirect(url, 307);
  }

  const locale = isLocale(requested) ? requested : DEFAULT_LOCALE;
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    // Route handlers, metadata images and anything with a file extension stay untouched.
    "/((?!_next/|api/|backend/|r/|opengraph-image|.*\\.[^/]+$).*)",
  ],
};
