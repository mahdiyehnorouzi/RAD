import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "رَد — استودیو سرامیک",
    short_name: "رَد",
    description: "آثار یگانه و سرامیک سفارشی، ساخته‌شده در تهران",
    start_url: "/",
    display: "standalone",
    background_color: "#eee7da",
    theme_color: "#a13d2e",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/rad-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
