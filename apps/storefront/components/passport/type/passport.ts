import type { LocaleCopy } from "@/types/locale";
import type { ProductCategory } from "@rad/types";

export const BEFORE_RAD_STAGES = ["idea", "hand", "material", "rad"] as const;

export type BeforeRadStageId = (typeof BEFORE_RAD_STAGES)[number];

export type PassportPhoto = {
  src: string;
  note: LocaleCopy;
};

export type PassportPlace = {
  place: LocaleCopy;
  note: LocaleCopy;
};

export type BeforeRadFrame = {
  id: BeforeRadStageId;
  src?: string;
  color: string;
  accent: string;
  caption: LocaleCopy;
};

export type WorkMark = {
  x: number;
  y: number;
  title: LocaleCopy;
  note: LocaleCopy;
};

export type PassportTransfer = {
  from: LocaleCopy;
  to: LocaleCopy;
  when: LocaleCopy;
};

export type PassportTraits = {
  crooked: number;
  quiet: number;
  worn: number;
  surprise: number;
  strange: number;
};

export type RadPassport = {
  code: string;
  slug: string;
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
  sold: boolean;
  whereabouts: {
    current: LocaleCopy;
    trail: PassportPlace[];
  };
  beforeRad: BeforeRadFrame[];
};
