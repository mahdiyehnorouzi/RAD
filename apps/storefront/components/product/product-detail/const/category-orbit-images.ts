import type { ProductCategory } from "@rad/types";

const ceramicOrbitImages = [
  "/catalog/graphic/orbit-grid-bowl-v2.png",
  "/catalog/graphic/orbit-blue-vase.png",
  "/catalog/graphic/orbit-sage-vessel.png",
] as const;

export const categoryOrbitImages: Partial<
  Record<ProductCategory, readonly [string, string, string]>
> = {
  ceramics: ceramicOrbitImages,
  vases: ceramicOrbitImages,
  tableware: ceramicOrbitImages,
  painting: [
    "/catalog/graphic/orbit-painting-palette.png",
    "/catalog/graphic/orbit-painting-brushes.png",
    "/catalog/graphic/orbit-painting-sketchbook.png",
  ],
  jewelry: [
    "/catalog/graphic/orbit-jewelry-bracelet.png",
    "/catalog/graphic/orbit-jewelry-necklace.png",
    "/catalog/graphic/orbit-jewelry-ring.png",
  ],
  print: [
    "/catalog/graphic/orbit-print-polaroid.png",
    "/catalog/graphic/orbit-print-stamp.png",
    "/catalog/graphic/orbit-print-hand.png",
  ],
  woodwork: [
    "/catalog/graphic/orbit-woodwork-comb.png",
    "/catalog/graphic/orbit-woodwork-spoon.png",
    "/catalog/graphic/orbit-woodwork-bowl.png",
  ],
  textile: [
    "/catalog/graphic/orbit-textile-pincushion.png",
    "/catalog/graphic/orbit-textile-spools.png",
    "/catalog/graphic/orbit-textile-fabric.png",
  ],
  sculpture: [
    "/catalog/graphic/orbit-sculpture-lamp.png",
    "/catalog/graphic/orbit-sculpture-chair.png",
    "/catalog/graphic/orbit-sculpture-vase.png",
  ],
};
