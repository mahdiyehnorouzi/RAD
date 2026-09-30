"use client";

import { useMemo } from "react";
import type { ShapeQuestion } from "@rad/types";
import { useCatalog } from "@/components/catalog/catalog-provider";
import { usePassports } from "@/hooks/use-artworks";
import { traitDistance } from "@/lib/passport";
import type { PassportTraits } from "@/components/passport/type";

const NEUTRAL: PassportTraits = {
  crooked: 0.5,
  quiet: 0.5,
  worn: 0.5,
  surprise: 0.5,
  strange: 0.5,
};

/** The three archive works whose recorded traits sit closest to the answers. */
export function useShapeMatches(
  questions: ShapeQuestion[],
  answers: Array<number | undefined>,
  done: boolean,
) {
  const passports = usePassports();
  const { getArtwork } = useCatalog();

  return useMemo(() => {
    if (!done) return [];
    const traits = { ...NEUTRAL };
    questions.forEach((question, index) => {
      const value = answers[index];
      if (value !== undefined) traits[question.trait] = value;
    });
    return passports
      .filter((passport) => passport.traits)
      .map((passport) => ({
        passport,
        distance: traitDistance(traits, passport.traits),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3)
      .map(({ passport }) => ({
        passport,
        artwork: getArtwork(passport.slug),
      }));
  }, [questions, answers, done, passports, getArtwork]);
}
