import type { ArtworkRecord } from "./type";
import { t } from "./copy";

const making = (file: string) => `/making/RAD-M-1405-17/${file}`;

/** Works still being made; their live progress is tracked by the storefront `now` pages. */
export const workshopArtworks: ArtworkRecord[] = [
  {
    radNumber: 14,
    slug: "halo-bowl",
    artistId: "artist-niloofar",
    category: "ceramics",
    initialStatus: "in_workshop",
    price: null,
    usdPrice: null,
    year: 2026,
    title: t("کاسه هاله", "Halo Bowl"),
    description: t(
      "کاسهٔ استون‌ور، در مرحلهٔ لعاب",
      "A stoneware bowl, at the glaze stage",
    ),
    story: t(
      "این کاسه هنوز در کارگاه ساخته می‌شود؛ روایتش پس از کوره کامل می‌شود.",
      "This bowl is still being made in the workshop; its story is completed after the kiln.",
    ),
    dimensions: null,
    materials: {
      body: t("استون‌ور شمیران", "Shemiran stoneware"),
      surface: null,
      process: null,
    },
    care: null,
    color: "#cbb892",
    accent: "#8a4938",
    shape: "round",
    images: [
      {
        src: making("glaze-tile.webp"),
        alt: "کاسه هاله در مرحلهٔ لعاب",
        enAlt: "Halo Bowl at the glaze stage",
      },
    ],
    passport: null,
    difference: null,
    owner: null,
  },
  {
    radNumber: 21,
    slug: "morning-bowl",
    artistId: "artist-sahar",
    category: "ceramics",
    initialStatus: "in_workshop",
    price: null,
    usdPrice: null,
    year: 2026,
    title: t("کاسه صبح", "Morning Bowl"),
    description: t(
      "کاسهٔ استون‌ور، در حال خشک شدن",
      "A stoneware bowl, drying",
    ),
    story: t(
      "این کاسه هنوز در کارگاه ساخته می‌شود؛ روایتش پس از کوره کامل می‌شود.",
      "This bowl is still being made in the workshop; its story is completed after the kiln.",
    ),
    dimensions: null,
    materials: {
      body: t("استون‌ور شمیران", "Shemiran stoneware"),
      surface: null,
      process: null,
    },
    care: null,
    color: "#ead9bd",
    accent: "#8a4938",
    shape: "round",
    images: [
      {
        src: making("cleaned.webp"),
        alt: "کاسه صبح پس از تراش",
        enAlt: "Morning Bowl after cleaning",
      },
    ],
    passport: null,
    difference: null,
    owner: null,
  },
];
