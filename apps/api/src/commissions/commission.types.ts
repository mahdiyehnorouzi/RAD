export type LocaleCopy = { fa: string; en: string };

export type MakingStageId =
  | "design_submitted"
  | "feasibility"
  | "quote"
  | "approval_deposit"
  | "making"
  | "pre_kiln"
  | "firing"
  | "reveal"
  | "shipping"
  | "complete"
  | "declined";

export type NextActor = "customer" | "artist" | "none";

export type MakingBrief = {
  concept: string;
  dimensions: string;
  material: string;
  intendedUse: string;
  budget: string;
  permission: string;
  category: string;
  image?: string;
  images?: string[];
};

export type StageMessage = {
  id: string;
  stageId: MakingStageId;
  author: "customer" | "artist" | "system";
  body: LocaleCopy;
  createdAt: number;
  internal?: boolean;
};

export type MakingCommission = {
  id: string;
  title: LocaleCopy;
  customerName: string;
  artistName: string;
  brief: MakingBrief;
  stage: MakingStageId;
  nextActor: NextActor;
  estimatedCompletion: number;
  deadlineAt?: number;
  createdAt: number;
  updatedAt: number;
  kilnLocked: boolean;
  messages: StageMessage[];
  changeRequests: Array<{
    id: string;
    whatChanged: LocaleCopy;
    whyNecessary: LocaleCopy;
    priceImpact: LocaleCopy;
    timeImpact: LocaleCopy;
    alternative?: LocaleCopy;
    createdAt: number;
    status: "open" | "accepted" | "withdrawn";
  }>;
  updates: unknown[];
  payments: unknown[];
  audit: Array<{
    id: string;
    at: number;
    actor: "customer" | "artist" | "system";
    stageId: MakingStageId;
    action: LocaleCopy;
  }>;
  internalNotes: StageMessage[];
};

export function loc(fa: string, en: string): LocaleCopy {
  return { fa, en };
}

export function newEntityId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function newCommissionId() {
  const n = Math.floor(100 + Math.random() * 900);
  return `RAD-M-1405-${n}`;
}
