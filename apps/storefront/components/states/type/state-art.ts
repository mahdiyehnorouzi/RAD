export type StateArtKind =
  | "not-found"
  | "error"
  | "no-results"
  | "empty-bag"
  | "empty-favorites"
  | "empty-category"
  | "no-access";

/** `split` places copy beside the object for full pages; `stack` centres it inside a page. */
export type StateLayout = "split" | "stack";
