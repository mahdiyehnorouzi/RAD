import type {ProductCategory, ProductVisual} from "@rad/types";

export type ArtworkField = {
  key: string;
  label: { fa: string; en: string };
  options: { fa: string[]; en: string[] };
};

export type ArtworkCategory = {
  id: ProductCategory;
  visual: ProductVisual;
  label: { fa: string; en: string };
  shortLabel: { fa: string; en: string };
  preview: { color: string; accent: string };
  fields: ArtworkField[];
};
