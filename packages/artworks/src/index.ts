import { archiveArtworks } from "./archive";
import { catalogArtworks } from "./catalog";
import { artworkFamilies } from "./families";
import type { ArtworkRecord } from "./type";
import { workshopArtworks } from "./workshop";

export { artists, artistById, RAD_STUDIO_ID } from "./artists";
export { careFor, t } from "./copy";
export { artworkFamilies } from "./families";
export type { ArtworkFamily, ArtworkRecord } from "./type";

export const artworkRecords: ArtworkRecord[] = [
  ...archiveArtworks,
  ...catalogArtworks,
  ...workshopArtworks,
].sort((a, b) => a.radNumber - b.radNumber);

/** Returns every problem that would let two sections show different data for one number. */
export function registryProblems(records: ArtworkRecord[] = artworkRecords) {
  const problems: string[] = [];
  const numbers = new Map<number, string>();
  const slugs = new Set<string>();
  for (const record of records) {
    const clash = numbers.get(record.radNumber);
    if (clash)
      problems.push(
        `RAD ${record.radNumber} is used by ${clash} and ${record.slug}`,
      );
    numbers.set(record.radNumber, record.slug);
    if (slugs.has(record.slug))
      problems.push(`slug ${record.slug} is used twice`);
    slugs.add(record.slug);
    const inspiredBy = record.passport?.inspiredBy;
    if (
      inspiredBy &&
      !numbers.has(inspiredBy) &&
      !records.some((item) => item.radNumber === inspiredBy)
    ) {
      problems.push(
        `RAD ${record.radNumber} is inspired by unknown RAD ${inspiredBy}`,
      );
    }
    if (
      record.owner &&
      record.initialStatus !== "sold" &&
      record.initialStatus !== "archived"
    ) {
      problems.push(
        `RAD ${record.radNumber} has an owner but is ${record.initialStatus}`,
      );
    }
  }
  for (const family of artworkFamilies) {
    for (const member of family.members) {
      if (!numbers.has(member))
        problems.push(`family ${family.id} lists unknown RAD ${member}`);
    }
  }
  return problems;
}
