import { NextResponse } from "next/server";
import { resolvePdpData } from "@/lib/catalog/resolve-pdp-data";

/**
 * The card-click PDP overlay's only data source. Calls the exact same
 * `resolvePdpData` the real route (app/[locale]/products/[slug]/page.tsx)
 * calls — this route exists only because the overlay runs client-side and
 * can't call a server-only function directly, not because it has its own
 * idea of what a PDP needs. Keeping both on one function is what makes it
 * structurally impossible for the two render paths to diverge in content.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const data = await resolvePdpData(slug);
  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if ("moved" in data) {
    return NextResponse.json({ moved: data.moved }, { status: 200 });
  }
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}
