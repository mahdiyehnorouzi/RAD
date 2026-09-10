import type { ProductCategory } from "@rad/types";

export type CategoryArtifactName =
  | "box"
  | "circle"
  | "droplets"
  | "flame"
  | "gem"
  | "hammer"
  | "layers"
  | "palette"
  | "paintbrush"
  | "scissors"
  | "sparkles"
  | "stamp"
  | "tree"
  | "waves";

export const categoryArtifacts: Record<
  ProductCategory,
  readonly [CategoryArtifactName, CategoryArtifactName, CategoryArtifactName]
> = {
  ceramics: ["flame", "droplets", "circle"],
  vases: ["flame", "droplets", "circle"],
  tableware: ["flame", "droplets", "circle"],
  painting: ["palette", "paintbrush", "sparkles"],
  textile: ["scissors", "waves", "layers"],
  woodwork: ["tree", "hammer", "circle"],
  sculpture: ["box", "hammer", "layers"],
  jewelry: ["gem", "circle", "sparkles"],
  print: ["stamp", "layers", "paintbrush"],
};
