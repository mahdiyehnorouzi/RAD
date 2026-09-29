export const homeMedia = {
  customOrder: [
    "/home/custom-order/01-brief-v2.webp",
    "/home/custom-order/02-artist-proposal-v2.webp",
    "/home/custom-order/03-making-v2.webp",
  ],
} as const;

/** The finished vase and the brass RAD stamp; the tall crop keeps the stamp in frame on phones. */
export const certificateScene = {
  wide: { src: "/home/certificate/scene-wide.webp", width: 1280, height: 720 },
  tall: { src: "/home/certificate/scene-tall.webp", width: 720, height: 1152 },
} as const;
