export type Toast = {
  id: number;
  kind: "favoriteAdded" | "favoriteRemoved" | "cartAdded" | "reviewAdded";
  productSlug?: string;
};
