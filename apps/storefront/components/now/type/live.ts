import type { LocaleCopy } from "@/types/locale";

export const LIVE_MILESTONES = [
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

export type LivePiece = {
  code: string;
  name: LocaleCopy;
  maker: LocaleCopy;
  startedDaysAgo: number;
  current: LiveMilestoneId;
  image?: string;
  milestones: LiveMilestone[];
  notes: LiveNote[];
};
