import type { LocaleCopy } from "@/types/locale";

export type { LocaleCopy };

export type MakingActor = "customer" | "artist" | "system";
export type NextActor = "customer" | "artist" | "none";

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

export type FeasibilityDecision =
  | "approve"
  | "request_change"
  | "offer_alternative"
  | "decline";

export type PhotoKind =
  | "concept"
  | "forming"
  | "cleaned"
  | "glaze"
  | "tile"
  | "fired"
  | "finished"
  | "packed";

export interface MakingBrief {
  concept: string;
  dimensions: string;
  material: string;
  intendedUse: string;
  budget: string;
  permission: string;
  category: string;
  image?: string;
}

export interface StageMessage {
  id: string;
  stageId: MakingStageId;
  author: MakingActor;
  body: LocaleCopy;
  createdAt: number;
  internal?: boolean;
}

export interface ChangeRequest {
  id: string;
  whatChanged: LocaleCopy;
  whyNecessary: LocaleCopy;
  priceImpact: LocaleCopy;
  timeImpact: LocaleCopy;
  alternative?: LocaleCopy;
  createdAt: number;
  status: "open" | "accepted" | "withdrawn";
}

export interface QuoteProposal {
  specification: LocaleCopy;
  artistName: string;
  priceToman: number;
  priceUsd: number;
  depositToman: number;
  depositUsd: number;
  completionWindow: LocaleCopy;
  includedRevisions: number;
  cancellationRules: LocaleCopy;
  createdAt: number;
}

export interface ApprovedSnapshot {
  quote: QuoteProposal;
  brief: MakingBrief;
  approvedAt: number;
}

export interface ProgressUpdate {
  id: string;
  stageId: MakingStageId;
  note: LocaleCopy;
  photoKind: PhotoKind;
  requiresApproval: boolean;
  createdAt: number;
}

export interface PreKilnProposal {
  dimensions: LocaleCopy;
  glazeCode: string;
  glazeName: LocaleCopy;
  colorRange: LocaleCopy;
  testTileNote: LocaleCopy;
  createdAt: number;
}

export interface FiringRecord {
  firingNote: LocaleCopy;
  finishingNote: LocaleCopy;
  qcNote: LocaleCopy;
  unexpected: boolean;
  resolution?: LocaleCopy;
  createdAt: number;
}

export interface MakingPayment {
  id: string;
  kind: "deposit" | "balance";
  status: "due" | "paid";
  amountToman: number;
  amountUsd: number;
  at?: number;
}

export interface AuditEvent {
  id: string;
  at: number;
  actor: MakingActor;
  stageId: MakingStageId;
  action: LocaleCopy;
}

export interface MakingCommission {
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
  tracking?: string;
  kilnLocked: boolean;
  messages: StageMessage[];
  changeRequests: ChangeRequest[];
  quote?: QuoteProposal;
  approvedSnapshot?: ApprovedSnapshot;
  updates: ProgressUpdate[];
  preKiln?: PreKilnProposal;
  firing?: FiringRecord;
  payments: MakingPayment[];
  audit: AuditEvent[];
  internalNotes: StageMessage[];
}
