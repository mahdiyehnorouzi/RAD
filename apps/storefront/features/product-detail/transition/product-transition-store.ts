import { create } from "zustand";

export type SourceRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius: number;
};

export type TransitionPhase = "closed" | "open";

interface ProductTransitionState {
  phase: TransitionPhase;
  slug: string | null;
  href: string | null;
  sourceRect: SourceRect | null;
  imageSrc: string | null;
  /** The source page's scroll position, restored once the overlay unmounts. */
  returnScrollY: number;
  open: (args: {
    slug: string;
    href: string;
    rect: SourceRect;
    imageSrc: string;
  }) => void;
  close: () => void;
}

/**
 * Drives the card -> PDP overlay (see `product-overlay.tsx`). A plain
 * Zustand store rather than React context: the opener (`ProductCardStage`,
 * mounted once per card, dozens of instances on a grid page) and the one
 * overlay instance need to talk without every card re-rendering on every
 * store change, and the open() call needs to be reachable from a plain
 * DOM click handler outside any particular component's render.
 */
export const useProductTransitionStore = create<ProductTransitionState>(
  (set) => ({
    phase: "closed",
    slug: null,
    href: null,
    sourceRect: null,
    imageSrc: null,
    returnScrollY: 0,
    open: ({ slug, href, rect, imageSrc }) =>
      set({
        phase: "open",
        slug,
        href,
        sourceRect: rect,
        imageSrc,
        returnScrollY: window.scrollY,
      }),
    close: () => set({ phase: "closed" }),
  }),
);
