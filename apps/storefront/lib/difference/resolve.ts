import "server-only";
import { cache } from "react";
import type { DifferencePortrait } from "@/components/difference/type";
import { resolveArtwork } from "@/lib/artworks/server";
import { passportFromArtwork } from "@/lib/passport";
import { portraitFromArtwork } from "./portraits";
import { recover } from "@/lib/log";

type DifferenceWork = {
  portrait: DifferencePortrait;
  /** Passport code, when the work has a passport to link to. */
  passportCode?: string;
};

/**
 * `null` = the API has no such portrait; `undefined` = the API is unreachable
 * and the registry has no such work either.
 */
export const resolveDifference = cache(
  async (id: string): Promise<DifferenceWork | null | undefined> => {
    const artwork = await resolveArtwork(id).catch(
      recover(`difference ${id}`, undefined),
    );
    if (artwork === undefined) return undefined;
    const portrait = artwork && portraitFromArtwork(artwork);
    if (!portrait || portrait.id !== id) return null;
    return {
      portrait,
      passportCode: passportFromArtwork(artwork)?.code,
    };
  },
);
