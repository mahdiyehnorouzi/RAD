import type { ArtistApplication } from "../database/entities";
import type {
  AdminArtistApplication,
  ArtworkCategory,
  CustomerArtistApplication,
  ShippingMethod,
  ArtistApplicationStatus,
} from "./type";

export function toCustomerArtistApplication(
  row: ArtistApplication,
): CustomerArtistApplication {
  return {
    id: row.id,
    fullName: row.fullName,
    artistName: row.artistName ?? undefined,
    contact: row.contact,
    city: row.city,
    instagram: row.instagram ?? undefined,
    artworkImages: row.artworkImages,
    about: row.about ?? undefined,
    categories: row.categories as ArtworkCategory[],
    shippingMethod: row.shippingMethod as ShippingMethod,
    availability: row.availability ?? undefined,
    status: row.status as ArtistApplicationStatus,
    createdAt: row.createdAt.getTime(),
  };
}

export function toAdminArtistApplication(
  row: ArtistApplication,
): AdminArtistApplication {
  return {
    ...toCustomerArtistApplication(row),
    reviewNote: row.reviewNote ?? undefined,
  };
}
