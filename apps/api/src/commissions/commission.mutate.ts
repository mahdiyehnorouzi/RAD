import {
  loc,
  newEntityId,
  type LocaleCopy,
  type MakingCommission,
  type StageMessage,
} from "./commission.types";

function touch(
  commission: MakingCommission,
  patch: Partial<MakingCommission>,
  event: { actor: "customer" | "artist" | "system"; stageId: MakingCommission["stage"]; action: LocaleCopy },
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

function withMessage(
  commission: MakingCommission,
  message: Omit<StageMessage, "id" | "createdAt">,
): MakingCommission {
  const entry: StageMessage = {
    ...message,
    id: newEntityId(message.internal ? "n" : "m"),
    createdAt: Date.now(),
  };
  if (message.internal) {
    return { ...commission, internalNotes: [...commission.internalNotes, entry] };
  }
  return { ...commission, messages: [...commission.messages, entry] };
}

export function addCommissionMessage(
  commission: MakingCommission,
  input: { author: "customer" | "artist"; body: LocaleCopy; internal?: boolean },
) {
  return withMessage(commission, {
    stageId: commission.stage,
    author: input.author,
    body: input.body,
    internal: input.internal,
  });
}

export function artistDecideCommission(
  commission: MakingCommission,
  decision: "approve" | "request_change" | "offer_alternative" | "decline",
  payload?: {
    reason?: LocaleCopy;
    alternative?: LocaleCopy;
    change?: {
      whatChanged: LocaleCopy;
      whyNecessary: LocaleCopy;
      priceImpact: LocaleCopy;
      timeImpact: LocaleCopy;
    };
  },
) {
  if (decision === "decline") {
    const reason =
      payload?.reason ?? loc("این طرح در ماده فعلی قابل ساخت نیست.", "This design cannot be made in the current material.");
    return withMessage(
      touch(
        commission,
        { stage: "declined", nextActor: "none" },
        { actor: "artist", stageId: "feasibility", action: loc("طرح با دلیل رد شد", "Design declined with a reason") },
      ),
      { stageId: "feasibility", author: "artist", body: reason },
    );
  }
  if (decision === "request_change" && payload?.change) {
    return touch(
      {
        ...commission,
        stage: "feasibility",
        nextActor: "customer",
        changeRequests: [
          ...commission.changeRequests,
          { ...payload.change, id: newEntityId("c"), createdAt: Date.now(), status: "open" },
        ],
      },
      {},
      { actor: "artist", stageId: "feasibility", action: loc("تغییر مشخص درخواست شد", "A specific change was requested") },
    );
  }
  if (decision === "offer_alternative") {
    const alternative =
      payload?.alternative ?? loc("بدیلی ساده‌تر با همین حس پیشنهاد می‌شود.", "A simpler alternative with the same feeling is offered.");
    return withMessage(
      touch(
        commission,
        { stage: "feasibility", nextActor: "customer" },
        { actor: "artist", stageId: "feasibility", action: loc("بدیل پیشنهاد شد", "An alternative was offered") },
      ),
      { stageId: "feasibility", author: "artist", body: alternative },
    );
  }
  return withMessage(
    touch(
      commission,
      { stage: "quote", nextActor: "artist" },
      { actor: "artist", stageId: "feasibility", action: loc("طرح تأیید شد", "Design approved") },
    ),
    {
      stageId: "feasibility",
      author: "artist",
      body: loc(
        "طرح شما تأیید شد. پیشنهاد قیمت و زمان‌بندی نوشته می‌شود.",
        "Your design was approved. A quote and schedule will be written.",
      ),
    },
  );
}
