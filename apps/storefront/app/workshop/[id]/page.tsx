"use client";

import { useParams } from "next/navigation";
import { ArtistWorkshopDetail } from "@/components/workshop";

export default function WorkshopDetailPage() {
  const params = useParams<{ id: string }>();
  return <ArtistWorkshopDetail id={String(params.id ?? "")} />;
}
