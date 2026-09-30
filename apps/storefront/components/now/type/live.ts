import type { ProductStatus } from "@rad/types";
import type { LocaleCopy } from "@/types/locale";

const LIVE_MILESTONES = [
  "idea",
  "form",
  "drying",
  "first_kiln",
  "glaze",
  "last_kiln",
  "ready",
] as const;

export type LiveMilestoneId = (typeof LIVE_MILESTONES)[number];

export type LiveMilestone = {
  id: LiveMilestoneId;
  title: LocaleCopy;
  /** What happens to a work at this stage. */
  summary: LocaleCopy;
  done: boolean;
  current: boolean;
  media?: string;
  note?: LocaleCopy;
};

export type LiveNote = {
  at: LocaleCopy;
  body: LocaleCopy;
  media?: string;
};

/** Workshop diary of one artwork; everything about the work itself lives on the artwork. */
export type LiveJournal = {
  radNumber: number;
  startedDaysAgo: number;
  current: LiveMilestoneId;
  image?: string;
  milestones: LiveMilestone[];
  notes: LiveNote[];
};

/** A journal joined with its artwork. */
export type LivePiece = Omit<LiveJournal, "radNumber"> & {
  code: string;
  slug: string;
  /** API status of the artwork; the only status shown. */
  status?: ProductStatus;
  name: LocaleCopy;
  maker: LocaleCopy;
};
