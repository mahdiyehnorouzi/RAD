import type {
  ProductCategory,
  ProductImage,
  ProductShape,
  ProductStatus,
} from "./index";

export interface LocalizedText {
  fa: string;
  en: string;
}

export interface ArtworkArtist {
  id: string;
  name: LocalizedText;
  kind: "rad" | "guest_artist";
  verified: boolean;
}

/** What the work is made of: body (clay, fibre, metal, wood), surface (glaze, dye, finish), process (firing, setting). */
export interface ArtworkMaterials {
  body: LocalizedText;
  surface: LocalizedText | null;
  process: LocalizedText | null;
}

export const BEFORE_RAD_STAGES = ["idea", "hand", "material", "rad"] as const;
export type BeforeRadStageId = (typeof BEFORE_RAD_STAGES)[number];

export interface PassportPhoto {
  src: string;
  note: LocalizedText;
}

export interface PassportPlace {
  place: LocalizedText;
  note: LocalizedText;
}

export interface BeforeRadFrame {
  id: BeforeRadStageId;
  src?: string;
  color: string;
  accent: string;
  caption: LocalizedText;
}

export interface WorkMark {
  x: number;
  y: number;
  title: LocalizedText;
  note: LocalizedText;
}

export interface PassportTransfer {
  from: LocalizedText;
  to: LocalizedText;
  when: LocalizedText;
}

export interface PassportTraits {
  crooked: number;
  quiet: number;
  worn: number;
  surprise: number;
  strange: number;
}

/**
 * Editorial life record of a work. Everything already on `Artwork`
 * (title, artist, materials, dimensions, story, care, owner, images) is not repeated here.
 */
export interface ArtworkPassport {
  /** Month the work was finished, when known more precisely than `Artwork.year`. */
  dateCreated: LocalizedText | null;
  /** Where the work lives now. */
  city: LocalizedText;
  firstSketch?: PassportPhoto;
  construction: PassportPhoto[];
  unexpectedChanges: LocalizedText;
  /** `radNumber` of the work this one grew out of. */
  inspiredBy?: number;
  inspiredNote?: LocalizedText;
  traits?: PassportTraits;
  marks?: WorkMark[];
  transfers?: PassportTransfer[];
  whereabouts: { current: LocalizedText; trail: PassportPlace[] };
  /** Falls back to the difference stages when omitted. */
  beforeRad?: BeforeRadFrame[];
}

export type DifferenceStageId =
  "described" | "imagined" | "artist" | "material";
export type SurprisePermission = "faithful" | "hand" | "material";

/** The gap between the brief (`Artwork.story`), the AI image, the hand and the material. */
export interface ArtworkDifference {
  permission: SurprisePermission;
  imaginedNote: LocalizedText;
  artistNotes: LocalizedText[];
  materialNotes: LocalizedText[];
  irregularity: LocalizedText;
  palette: Record<DifferenceStageId, { color: string; accent: string }>;
  stageImages?: Partial<Record<DifferenceStageId, string>>;
}

/**
 * The one record for a work. Catalog cards, product pages, passports, the
 * difference museum and home sections are all views of this object.
 */
export interface Artwork {
  id: string;
  /** Permanent archive number (`RAD / 041`). Never derived from list position. */
  radNumber: number | null;
  slug: string;
  title: LocalizedText;
  artist: ArtworkArtist;
  category: ProductCategory;
  /** Owned by the API; absent in static fallback data. */
  status?: ProductStatus;
  reservedUntil?: number;
  /** Toman. `null` for works that were never offered for sale. */
  price: number | null;
  currency: "IRT";
  usdPrice: number | null;
  year: number | null;
  materials: ArtworkMaterials;
  dimensions: LocalizedText | null;
  /** One line under the title. */
  description: LocalizedText;
  story: LocalizedText;
  care: LocalizedText | null;
  images: ProductImage[];
  color: string;
  accent: string;
  shape: ProductShape;
  passport: ArtworkPassport | null;
  difference: ArtworkDifference | null;
  /** Current keeper; `null` while the work is still with RAD. */
  owner: LocalizedText | null;
  createdAt?: number;
  updatedAt?: number;
}

export function formatRadCode(radNumber: number) {
  return String(radNumber).padStart(3, "0");
}

export function parseRadNumber(value: string | number | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "");
  const parsed = digits ? Number(digits) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
