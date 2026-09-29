import type { PolicySlug } from "@rad/types";
import type { LocaleCopy } from "@/types/locale";

export type PolicyKind = "guide" | "legal";

export type PolicyIcon =
  | "bag"
  | "palette"
  | "truck"
  | "package"
  | "scale"
  | "lock"
  | "ban"
  | "card"
  | "fingerprint"
  | "clock"
  | "receipt"
  | "shield"
  | "pin"
  | "map"
  | "route"
  | "undo"
  | "camera"
  | "hammer"
  | "pen"
  | "cancel"
  | "check"
  | "history";

export type PolicyBlock =
  | { kind: "p"; text: LocaleCopy }
  | { kind: "list"; items: LocaleCopy[] }
  /** An ordered sequence the reader follows step by step. */
  | { kind: "steps"; items: LocaleCopy[] }
  /** A plain-language aside that softens or explains the clause above it. */
  | { kind: "note"; text: LocaleCopy };

export type PolicySection = {
  id: string;
  title: LocaleCopy;
  blocks: PolicyBlock[];
  /**
   * The clause is published but still being checked against the law. The
   * page says so next to it; remove the flag once the review is done.
   */
  underReview?: LocaleCopy;
};

/**
 * One line of the "in short" summary at the top of a document. The product
 * page, bag and checkout quote these by id, so they always match the text.
 */
export type PolicyPoint = {
  id: string;
  icon: PolicyIcon;
  label: LocaleCopy;
  value: LocaleCopy;
};

export type PolicyVersion = {
  /** Publication date `YYYY-MM-DD`; also the id orders store. */
  id: string;
  /** What changed, in one sentence. The first version says it is the first. */
  change: LocaleCopy;
  points: PolicyPoint[];
  sections: PolicySection[];
};

export type PolicyDocument = {
  slug: PolicySlug;
  kind: PolicyKind;
  icon: PolicyIcon;
  title: LocaleCopy;
  /** One line under the title on the hub and in search results. */
  summary: LocaleCopy;
  /** Newest first. Published versions are never edited in place. */
  versions: PolicyVersion[];
};
