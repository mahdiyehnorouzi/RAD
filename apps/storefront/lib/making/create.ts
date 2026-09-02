import type {AuditEvent, LocaleCopy, MakingBrief, MakingCommission,} from "@/components/making/type";

function loc(fa: string, en: string): LocaleCopy {
  return { fa, en };
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

const day = 24 * 60 * 60 * 1000;
export function newCommissionId() {
  const n = Math.floor(100 + Math.random() * 900);
  return `RAD-M-1405-${n}`;
}

export function newEntityId(prefix: string) {
  return id(prefix);
}

export function createSubmittedCommission(input: {
  customerName: string;
  brief: MakingBrief;
  title?: LocaleCopy;
}): MakingCommission {
  const createdAt = Date.now();
  const commission: MakingCommission = {
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
    updates: input.brief.image
      ? [
          {
            id: newEntityId("u"),
            stageId: "design_submitted",
            note: loc("تصویر تولیدشده همراه طرح ثبت شد.", "The generated image was filed with the design."),
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
  return commission;
}

export function touch(
  commission: MakingCommission,
  patch: Partial<MakingCommission>,
  event: Omit<AuditEvent, "id" | "at">,
): MakingCommission {
  return {
    ...commission,
    ...patch,
    updatedAt: Date.now(),
    audit: [
      ...commission.audit,
      { ...event, id: newEntityId("a"), at: Date.now() },
    ],
  };
}
