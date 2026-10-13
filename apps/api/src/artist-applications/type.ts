import type {
  ARTIST_APPLICATION_STATUSES,
  ARTWORK_CATEGORIES,
  SHIPPING_METHODS,
} from "./const";

export type ArtworkCategory = (typeof ARTWORK_CATEGORIES)[number];
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];
export type ArtistApplicationStatus =
  (typeof ARTIST_APPLICATION_STATUSES)[number];

/** The application as the applicant sees it after submitting. */
export type CustomerArtistApplication = {
  id: string;
  fullName: string;
  artistName?: string;
  contact: string;
  city: string;
  instagram?: string;
  artworkImages: string[];
  about?: string;
  categories: ArtworkCategory[];
  shippingMethod: ShippingMethod;
  availability?: string;
  status: ArtistApplicationStatus;
  createdAt: number;
};

/** Staff also see the review note left on the application. */
export type AdminArtistApplication = CustomerArtistApplication & {
  reviewNote?: string;
};
