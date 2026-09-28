import type { StateArtKind } from "../type";

/** Still lifes shot on white; they are multiplied onto the page so the white drops out. */
export const STATE_ART: Record<StateArtKind, string> = {
  "not-found": "/states/not-found.jpg",
  error: "/states/error.jpg",
  "no-results": "/states/no-results.jpg",
  "empty-bag": "/states/empty-bag.jpg",
  "empty-favorites": "/states/empty-favorites.jpg",
  "empty-category": "/states/empty-category.jpg",
  "no-access": "/states/no-access.jpg",
};

export const STATE_ART_SIZE = 960;
