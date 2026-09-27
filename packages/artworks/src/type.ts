import type { Artwork, LocalizedText, ProductStatus } from "@rad/types";

/**
 * Authoring shape of a work. The API seed writes it to the database and the
 * storefront uses it only while the API is unreachable.
 */
export type ArtworkRecord = Omit<
  Artwork,
  | "id"
  | "artist"
  | "status"
  | "reservedUntil"
  | "currency"
  | "createdAt"
  | "updatedAt"
> & {
  radNumber: number;
  artistId: string;
  /** Written by the seed only; the API owns status afterwards. */
  initialStatus: ProductStatus;
};

export type ArtworkFamily = {
  id: string;
  name: LocalizedText;
  /** `radNumber`s in the order the family grew. */
  members: number[];
};
