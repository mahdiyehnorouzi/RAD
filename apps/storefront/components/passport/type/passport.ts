import type { LocaleCopy } from "@/types/locale";
import type {
  BeforeRadFrame,
  PassportPhoto,
  PassportPlace,
  PassportTraits,
  PassportTransfer,
  ProductCategory,
  ProductStatus,
  WorkMark,
} from "@rad/types";

export {
  BEFORE_RAD_STAGES,
  type BeforeRadFrame,
  type BeforeRadStageId,
  type PassportPhoto,
  type PassportPlace,
  type PassportTraits,
  type PassportTransfer,
  type WorkMark,
} from "@rad/types";

/** Passport view of an `Artwork`; every field is projected from that one record. */
export type RadPassport = {
  radNumber: number;
  code: string;
  slug: string;
  /** API status of the artwork; absent while only the registry fallback is loaded. */
  status?: ProductStatus;
  /** Set when the work is offered in the shop. */
  productSlug?: string;
  differenceId?: string;
  familyId?: string;
  inspiredBy?: string;
  inspiredNote?: LocaleCopy;
  traits?: PassportTraits;
  marks?: WorkMark[];
  transfers?: PassportTransfer[];
  category: ProductCategory;
  name: LocaleCopy;
  maker: LocaleCopy;
  dateCreated: LocaleCopy;
  clay: LocaleCopy;
  glaze: LocaleCopy;
  dimensions: LocaleCopy;
  firing: LocaleCopy;
  inspiration: LocaleCopy;
  firstSketch?: PassportPhoto;
  construction: PassportPhoto[];
  unexpectedChanges: LocaleCopy;
  finalPhotos: PassportPhoto[];
  owner: LocaleCopy;
  city: LocaleCopy;
  care: LocaleCopy;
  whereabouts: {
    current: LocaleCopy;
    trail: PassportPlace[];
  };
  beforeRad: BeforeRadFrame[];
};
