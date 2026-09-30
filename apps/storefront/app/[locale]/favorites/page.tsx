import { Suspense } from "react";
import { FavoritesPage } from "@/components/favorites";
export default function Page() {
  return (
    <Suspense>
      <FavoritesPage />
    </Suspense>
  );
}
