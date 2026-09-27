/**
 * Mirrors `Artwork` in `@rad/types` (the API is CommonJS and cannot import
 * that ESM package). Keep both shapes identical.
 */
export type LocalizedText = { fa: string; en: string };

export type ArtworkMaterials = {
  body: LocalizedText;
  surface: LocalizedText | null;
  process: LocalizedText | null;
};

export type ArtworkArtist = {
  id: string;
  name: LocalizedText;
  kind: "rad" | "guest_artist";
  verified: boolean;
};

export type CatalogImage = {
  src?: string;
  alt: string;
  enAlt: string;
  color?: string;
  accent?: string;
  shape?: string;
};

export type ArtworkResponse = {
  id: string;
  radNumber: number | null;
  slug: string;
  title: LocalizedText;
  artist: ArtworkArtist;
  category: string;
  status: string;
  reservedUntil?: number;
  price: number | null;
  currency: "IRT";
  usdPrice: number | null;
  year: number | null;
  materials: ArtworkMaterials;
  dimensions: LocalizedText | null;
  description: LocalizedText;
  story: LocalizedText;
  care: LocalizedText | null;
  images: CatalogImage[];
  color: string;
  accent: string;
  shape: string;
  /** Editorial JSON authored in `@rad/artworks`; passed through untouched. */
  passport: Record<string, unknown> | null;
  difference: Record<string, unknown> | null;
  owner: LocalizedText | null;
  createdAt: number;
  updatedAt: number;
};
