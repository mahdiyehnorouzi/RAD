export type PolaroidFrame = {
  href: string;
  src: string;
  alt: string;
  caption: string;
  material: string;
  /** Concept pieces are not archive works, so they never carry a RAD number. */
  conceptLabel: string;
  barcode: string;
  note: string;
  tone: "stone" | "textile" | "metal";
};
