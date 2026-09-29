import { NotFoundState } from "@/components/states";

export function ProductNotFound() {
  return (
    <NotFoundState
      title="productNotFoundTitle"
      body="productNotFoundBody"
      secondary={{ href: "/products", label: "allWorks" }}
    />
  );
}
