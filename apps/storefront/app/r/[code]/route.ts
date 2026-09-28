import { parseRadNumber } from "@rad/types";
import { resolveArtwork } from "@/lib/artworks";
import { passportFromArtwork } from "@/lib/passport";

type RouteContext = { params: Promise<{ code: string }> };

function passportPath(code: string | undefined) {
  return code ? `/passport/${code}` : null;
}

/**
 * Printed QR codes point here (`/r/027`). Keep this a temporary redirect so a
 * changed slug is picked up by phones that already scanned the old one.
 */
export async function GET(request: Request, context: RouteContext) {
  const { code } = await context.params;
  const radNumber = /^\d+$/.test(code) ? parseRadNumber(code) : null;
  const artwork = radNumber ? await resolveArtwork(String(radNumber)) : null;

  const path = !artwork
    ? null
    : artwork.price !== null
      ? `/products/${artwork.slug}`
      : passportPath(passportFromArtwork(artwork)?.code);

  if (!path) return new Response("Not found", { status: 404 });

  const target = new URL(path, request.url);
  target.search = new URL(request.url).search;
  return Response.redirect(target, 307);
}
