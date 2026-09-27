import { formatRadCode, visualForCategory, type Artwork } from "@rad/types";
import type { DifferencePortrait } from "@/components/difference/type";
import { fallbackArtworks } from "@/lib/artworks";

/** Difference-museum view of an `Artwork`; `null` when the work has no difference record. */
export function portraitFromArtwork(
  artwork: Artwork,
): DifferencePortrait | null {
  const difference = artwork.difference;
  if (!difference || !artwork.radNumber) return null;
  return {
    id: artwork.slug,
    code: `RAD / ${formatRadCode(artwork.radNumber)}`,
    title: artwork.title,
    year: String(artwork.year ?? ""),
    permission: difference.permission,
    category: artwork.category,
    visual: visualForCategory(artwork.category),
    maker: artwork.artist.name,
    described: artwork.story,
    imaginedNote: difference.imaginedNote,
    artistNotes: difference.artistNotes,
    materialNotes: difference.materialNotes,
    fingerprint: {
      clay: artwork.materials.body,
      glaze: artwork.materials.surface ?? artwork.description,
      firing: artwork.materials.process ?? {
        fa: "پخت استودیو رَد، تهران",
        en: "RAD studio firing, Tehran",
      },
      irregularity: difference.irregularity,
    },
    palette: difference.palette,
    stageImages: difference.stageImages,
  };
}

export function portraitsFrom(artworks: Artwork[]): DifferencePortrait[] {
  return artworks
    .map(portraitFromArtwork)
    .filter((item): item is DifferencePortrait => Boolean(item));
}

/** Registry portraits for static params and metadata; client views read live artworks. */
export const museumPortraits: DifferencePortrait[] =
  portraitsFrom(fallbackArtworks);

export function portraitById(portraits: DifferencePortrait[], id: string) {
  return portraits.find((item) => item.id === id);
}
