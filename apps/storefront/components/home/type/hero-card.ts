export type HeroCard = {
  href: string;
  src: string;
  alt: string;
  title: string;
  material: string;
  /** Concept pieces are not archive works, so they never carry a RAD number. */
  conceptLabel: string;
  note: string;
  tone: "stone" | "textile" | "metal";
};
