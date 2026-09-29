export type HeroCard = {
  src: string;
  alt: string;
  title: string;
  /** Written by hand on the back of the card. */
  note: string;
  /** The note in the maker's own handwriting, as transparent ink; the text is set in a pen font without it. */
  noteArt?: string;
  tone: "stone" | "textile" | "metal" | "ceramic";
};
