export const homeMedia = {
  entryReady: "/home/entry-ready-v2.jpg",
  entryCustom: "/home/entry-custom-v2.jpg",
  aboutRadTrace: "/home/about-rad-trace.webp",
  customOrder: [
    "/home/custom-order/01-brief-v2.jpg",
    "/home/custom-order/02-artist-proposal-v2.jpg",
    "/home/custom-order/03-making-v2.jpg",
  ],
  videoPoster: "/studio-process.jpg",
} as const;

/** The finished vase and the brass RAD stamp; the tall crop keeps the stamp in frame on phones. */
export const certificateScene = {
  wide: { src: "/home/certificate/scene-wide.jpg", width: 1280, height: 720 },
  tall: { src: "/home/certificate/scene-tall.jpg", width: 720, height: 1152 },
} as const;
