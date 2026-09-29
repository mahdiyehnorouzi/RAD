import type { StateArtKind } from "../type";

/** Still lifes shot on white; they are multiplied onto the page so the white drops out. */
export const STATE_ART: Record<StateArtKind, string> = {
  "not-found": "/states/not-found.webp",
  error: "/states/error.webp",
  "no-results": "/states/no-results.webp",
  "empty-bag": "/states/empty-bag.webp",
  "empty-favorites": "/states/empty-favorites.webp",
  "empty-category": "/states/empty-category.webp",
  "no-access": "/states/no-access.webp",
};

export const STATE_ART_SIZE = 960;
