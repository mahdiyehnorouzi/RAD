export { ProductDetail } from "./product-detail";
export { ProductOverlay } from "./transition/product-overlay";
export {
  useProductTransitionStore,
  type SourceRect,
} from "./transition/product-transition-store";
export {
  registerProductSource,
  getProductSourceRect,
  getProductSourceImageSrc,
} from "./transition/source-registry";
export { useOpenProductTransition } from "./transition/use-open-product-transition";
