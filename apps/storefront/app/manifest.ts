import type { MetadataRoute } from "next";
import { mockStorefront } from "@/lib/catalog/mock-storefront";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: mockStorefront.brand.title.fa,
    short_name: "رَد",
    description: mockStorefront.brand.description.fa,
    start_url: "/",
    display: "standalone",
    background_color: "#eee7da",
    theme_color: "#a13d2e",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/rad-logo.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/rad-logo.png",
        sizes: "1254x1254",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
