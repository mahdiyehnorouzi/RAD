import type { ArtworkArtist } from "@rad/types";
import { t } from "./copy";

export const RAD_STUDIO_ID = "rad-studio";

export const artists: ArtworkArtist[] = [
  {
    id: RAD_STUDIO_ID,
    name: t("استودیو رَد", "RAD Studio"),
    kind: "rad",
    verified: true,
  },
  {
    id: "artist-sahar",
    name: t("سحر میرزایی", "Sahar Mirzaei"),
    kind: "guest_artist",
    verified: true,
  },
  {
    id: "artist-niloofar",
    name: t("نیلوفر احمدی", "Niloofar Ahmadi"),
    kind: "guest_artist",
    verified: true,
  },
  {
    id: "artist-kimia",
    name: t("کیمیا رضایی", "Kimia Rezaei"),
    kind: "guest_artist",
    verified: true,
  },
  {
    id: "artist-arman",
    name: t("آرمان کاظمی", "Arman Kazemi"),
    kind: "guest_artist",
    verified: true,
  },
  {
    id: "artist-leila",
    name: t("لیلا موسوی", "Leila Mousavi"),
    kind: "guest_artist",
    verified: true,
  },
  {
    id: "artist-saman",
    name: t("سامان کریمی", "Saman Karimi"),
    kind: "guest_artist",
    verified: true,
  },
  {
    id: "artist-mahtab",
    name: t("مهتاب رضوی", "Mahtab Razavi"),
    kind: "guest_artist",
    verified: true,
  },
];

export function artistById(id: string | null | undefined): ArtworkArtist {
  return artists.find((artist) => artist.id === id) ?? artists[0];
}
