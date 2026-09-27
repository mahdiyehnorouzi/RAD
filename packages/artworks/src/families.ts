import type { ArtworkFamily } from "./type";
import { t } from "./copy";

/** Links between members come from each passport's `inspiredBy`. */
export const artworkFamilies: ArtworkFamily[] = [
  {
    id: "kaj-dasteh",
    name: t("خانواده کج‌دسته‌ها", "The crooked-handle family"),
    members: [17, 7, 31],
  },
  { id: "haleh", name: t("خانواده هاله", "The halo family"), members: [29] },
  {
    id: "kiln",
    name: t("خانواده اتفاق‌های کوره", "The kiln-accident family"),
    members: [41, 44],
  },
];
