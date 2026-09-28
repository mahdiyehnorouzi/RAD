/**
 * `featured` — wide home plate with a view rail and a description.
 * `standard` — upright card with a full "more" action.
 * `compact` — shop-floor and carousel plate: number, name, price, code.
 * `suggest` — a way forward under empty and error states.
 */
export type ProductCardVariant = "featured" | "standard" | "compact" | "suggest";

export type ProductBadgeTone = "sold" | "bag" | "popular" | "neutral";

export type ProductCardSlide = { kind: "photo"; index: number } | { kind: "plate" };
