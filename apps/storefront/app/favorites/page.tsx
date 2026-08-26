import { Suspense } from "react";
import { FavoritesPage } from "@/components/favorites-page";
export default function Page() {
  return (
    <Suspense>
      <FavoritesPage />
    </Suspense>
  );
}
