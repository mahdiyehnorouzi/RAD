import type { CollaborateStep } from "../const";

export type CollaborateDraft = {
  step: CollaborateStep;
  fullName: string;
  artistName: string;
  contact: string;
  city: string;
  instagram: string;
  artworkImages: string[];
  about: string;
  categories: string[];
  shippingMethod: string;
  availability: string;
};
