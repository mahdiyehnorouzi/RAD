import "server-only";
import { artistById, artworkRecords, type ArtworkRecord } from "@rad/artworks";
import type { Artwork } from "@rad/types";

function fromRecord({
  artistId,
  initialStatus: _status,
  ...record
}: ArtworkRecord): Artwork {
  return {
    ...record,
    id: record.slug,
    artist: artistById(artistId),
    currency: "IRT",
  };
}

/** The shared registry, used only while the API has not answered. Carries no status. */
export const fallbackArtworks: Artwork[] = artworkRecords.map(fromRecord);
