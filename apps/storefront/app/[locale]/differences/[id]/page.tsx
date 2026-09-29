"use client";

import { useParams } from "next/navigation";
import { DifferencePortraitView } from "@/components/difference";
import { NotFoundState } from "@/components/states";
import { usePortraits } from "@/hooks/use-artworks";
import { museumPortraits, portraitById } from "@/lib/difference";

export default function DifferenceDetail() {
  const params = useParams<{ id: string }>();
  const id = String(params.id ?? "");
  const portrait =
    portraitById(usePortraits(), id) ?? portraitById(museumPortraits, id);
  if (!portrait) {
    return (
      <NotFoundState
        title="museumMissing"
        body="museumBody"
        primary={{ href: "/differences", label: "museumBack" }}
        secondary={{ href: "/studio", label: "designMine" }}
      />
    );
  }
  return <DifferencePortraitView portrait={portrait} />;
}
