import { Suspense } from "react";
import { ProductsPage } from "../../../features/products/products-page";

export default function ProductsRoute() {
  return (
    <Suspense fallback={<p className="admin-loading">در حال بارگذاری آثار…</p>}>
      <ProductsPage />
    </Suspense>
  );
}
