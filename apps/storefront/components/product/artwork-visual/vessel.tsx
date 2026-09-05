"use client";
import type { Product } from "@rad/types";

export function Vessel({
  product,
  className = "",
}: {
  product: Pick<Product, "color" | "accent" | "shape">;
  className?: string;
}) {
  return (
    <div
      className={`vessel ${product.shape} ${className}`}
      style={{ "--vessel": product.color, "--accent": product.accent } as React.CSSProperties}
    >
      <span className="vessel-neck" />
      <span className="vessel-line" />
    </div>
  );
}
