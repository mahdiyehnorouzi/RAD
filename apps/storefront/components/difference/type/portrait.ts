import type { ProductCategory, ProductVisual } from "@rad/types";
import type { LocaleCopy } from "@/types/locale";
import type { SurprisePermission } from "./permission";

export type DifferenceStageId = "described" | "imagined" | "artist" | "material";

export type DifferencePortrait = {
  id: string;
  code: string;
  year: string;
  permission: SurprisePermission;
  category: ProductCategory;
  visual: ProductVisual;
  maker: LocaleCopy;
  described: LocaleCopy;
  imaginedNote: LocaleCopy;
  artistNotes: LocaleCopy[];
  materialNotes: LocaleCopy[];
  fingerprint: {
    clay: LocaleCopy;
    glaze: LocaleCopy;
    firing: LocaleCopy;
    irregularity: LocaleCopy;
  };
  palette: {
    described: { color: string; accent: string };
    imagined: { color: string; accent: string };
    artist: { color: string; accent: string };
    material: { color: string; accent: string };
  };
};
