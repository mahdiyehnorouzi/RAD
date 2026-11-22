"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ProfileExperience } from "@/components/account";
import { FavoritesPage } from "@/components/favorites";

function FavoritesRoute() {
  const shared = useSearchParams().get("items");
  if (shared) return <FavoritesPage />;
  return <ProfileExperience initial="favorites" />;
}

export default function Page() {
  return (
    <Suspense>
      <FavoritesRoute />
    </Suspense>
  );
}
