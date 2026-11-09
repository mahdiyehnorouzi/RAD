/**
 * One mark per artwork-detail fact. Admin attribute keys that name the same
 * fact share that fact's icon; unrelated keys do not fall back to one glyph.
 */
export const SPEC_ATTRIBUTE_ICON = {
  color: "Palette",
  colour: "Palette",
  maker: "Hand",
  "construction-time": "Clock3",
  "unic-id": "Hash",
  height: "MoveVertical",
  weight: "Weight",
  glaze: "Droplets",
} as const;

/** Distinct fallbacks for an attribute key this map does not know yet. */
export const SPEC_ATTRIBUTE_ICON_FALLBACKS = [
  "ScrollText",
  "Blend",
  "SquareStack",
] as const;

export function specAttributeIconName(
  key: string,
  used: ReadonlySet<string> = new Set(),
): string {
  const mapped = SPEC_ATTRIBUTE_ICON[key as keyof typeof SPEC_ATTRIBUTE_ICON];
  if (mapped) return mapped;
  return (
    SPEC_ATTRIBUTE_ICON_FALLBACKS.find((name) => !used.has(name)) ??
    SPEC_ATTRIBUTE_ICON_FALLBACKS[0]
  );
}
