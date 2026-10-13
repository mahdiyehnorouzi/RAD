import { api } from "./client";

export type ArtistApplicationInput = {
  fullName: string;
  artistName?: string;
  contact: string;
  city: string;
  instagram?: string;
  artworkImages: string[];
  about?: string;
  categories: string[];
  shippingMethod: string;
  availability?: string;
};

export type ArtistApplication = ArtistApplicationInput & {
  id: string;
  status: string;
  createdAt: number;
};

export async function submitArtistApplication(input: ArtistApplicationInput) {
  return api<ArtistApplication>("/artist-applications", {
    method: "POST",
    timeoutMs: 25_000,
    body: JSON.stringify(input),
  });
}
