import type { Vendor } from "@rad/types";

export const radStudio: Vendor = {
  id: "rad-studio",
  displayName: "استودیو رَد",
  displayNameEn: "RAD Studio",
  kind: "rad",
  verified: true,
};

export const guestArtists = {
  sahar: {
    id: "artist-sahar",
    displayName: "سحر میرزایی",
    displayNameEn: "Sahar Mirzaei",
    kind: "guest_artist",
    verified: true,
  },
  niloofar: {
    id: "artist-niloofar",
    displayName: "نیلوفر احمدی",
    displayNameEn: "Niloofar Ahmadi",
    kind: "guest_artist",
    verified: true,
  },
  kimia: {
    id: "artist-kimia",
    displayName: "کیمیا رضایی",
    displayNameEn: "Kimia Rezaei",
    kind: "guest_artist",
    verified: true,
  },
  arman: {
    id: "artist-arman",
    displayName: "آرمان کاظمی",
    displayNameEn: "Arman Kazemi",
    kind: "guest_artist",
    verified: true,
  },
  leila: {
    id: "artist-leila",
    displayName: "لیلا موسوی",
    displayNameEn: "Leila Mousavi",
    kind: "guest_artist",
    verified: true,
  },
} satisfies Record<string, Vendor>;
