import type { MetadataRoute } from "next";
import { brand } from "@/lib/brand";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.title.fa,
    short_name: "رَد",
    description: brand.description.fa,
    start_url: "/",
    display: "standalone",
    background_color: "#eee7da",
    theme_color: "#a13d2e",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/rad-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/rad-logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
