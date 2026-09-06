import {
  loc,
  newCommissionId,
  newEntityId,
  type MakingBrief,
  type MakingCommission,
} from "./commission.types";

const day = 24 * 60 * 60 * 1000;

export function createSubmittedCommission(input: {
  customerName: string;
  brief: MakingBrief;
  title?: { fa: string; en: string };
}): MakingCommission {
  const createdAt = Date.now();
  return {
    id: newCommissionId(),
    title: input.title ?? loc(input.brief.concept.slice(0, 42), input.brief.concept.slice(0, 42)),
    customerName: input.customerName,
    artistName: "سحر میرزایی",
    brief: input.brief,
    stage: "design_submitted",
    nextActor: "artist",
    estimatedCompletion: createdAt + 42 * day,
    deadlineAt: createdAt + 4 * day,
    createdAt,
    updatedAt: createdAt,
    kilnLocked: false,
    messages: [],
    changeRequests: [],
    updates:
      input.brief.image || input.brief.images?.length
        ? [
            {
              id: newEntityId("u"),
              stageId: "design_submitted",
              note: loc("تصویرهای مرجع همراه طرح ثبت شد.", "Reference images were filed with the design."),
              photoKind: "concept",
              requiresApproval: false,
              createdAt,
            },
          ]
        : [],
    payments: [],
    audit: [
      {
        id: newEntityId("a"),
        at: createdAt,
        actor: "customer",
        stageId: "design_submitted",
        action: loc("طرح ارسال شد", "Design submitted"),
      },
    ],
    internalNotes: [],
  };
}
