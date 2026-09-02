"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createSubmittedCommission,
  newEntityId,
  seedCommissions,
  touch,
  type ChangeRequest,
  type FeasibilityDecision,
  type FiringRecord,
  type LocaleCopy,
  type MakingBrief,
  type MakingCommission,
  type MakingStageId,
  type PhotoKind,
  type PreKilnProposal,
  type QuoteProposal,
  type StageMessage,
} from "@/lib/making-commission";

const storageKey = "rad-making-commissions";

type MakingContextValue = {
  ready: boolean;
  commissions: MakingCommission[];
  get: (id: string) => MakingCommission | undefined;
  submitDesign: (input: {
    customerName: string;
    brief: MakingBrief;
    title?: LocaleCopy;
  }) => MakingCommission;
  addMessage: (
    id: string,
    input: { author: StageMessage["author"]; body: LocaleCopy; internal?: boolean },
  ) => void;
  artistDecide: (
    id: string,
    decision: FeasibilityDecision,
    payload?: {
      reason?: LocaleCopy;
      change?: Omit<ChangeRequest, "id" | "createdAt" | "status">;
      alternative?: LocaleCopy;
    },
  ) => void;
  customerResolveChange: (id: string, accept: boolean, note?: LocaleCopy) => void;
  artistSendQuote: (id: string, quote: QuoteProposal) => void;
  customerApproveDeposit: (id: string) => void;
  artistPublishUpdate: (
    id: string,
    input: { note: LocaleCopy; photoKind: PhotoKind; requiresApproval?: boolean },
  ) => void;
  artistOpenPreKiln: (id: string, proposal: PreKilnProposal) => void;
  customerApproveKiln: (id: string) => void;
  artistRecordFiring: (id: string, record: FiringRecord) => void;
  customerAcceptResolution: (id: string) => void;
  customerPayBalance: (id: string) => void;
  artistShip: (id: string, tracking: string) => void;
};

const MakingContext = createContext<MakingContextValue | null>(null);

function loc(fa: string, en: string): LocaleCopy {
  return { fa, en };
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

export function MakingProvider({ children }: { children: ReactNode }) {
  const [commissions, setCommissions] = useState<MakingCommission[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as MakingCommission[];
        if (Array.isArray(parsed) && parsed.length) {
          setCommissions(parsed);
          setReady(true);
          return;
        }
      }
    } catch {}
    setCommissions(seedCommissions);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(commissions));
    } catch {}
  }, [commissions, ready]);

  const update = useCallback((id: string, map: (current: MakingCommission) => MakingCommission) => {
    setCommissions((current) =>
      current.map((item) => (item.id === id ? map(item) : item)),
    );
  }, []);

  const value = useMemo<MakingContextValue>(
    () => ({
      ready,
      commissions,
      get: (id) => commissions.find((item) => item.id === id),
      submitDesign: (input) => {
        const created = createSubmittedCommission(input);
        setCommissions((current) => [created, ...current]);
        return created;
      },
      addMessage: (id, input) => {
        update(id, (current) =>
          withMessage(current, {
            stageId: current.stage,
            author: input.author,
            body: input.body,
            internal: input.internal,
          }),
        );
      },
      artistDecide: (id, decision, payload) => {
        update(id, (current) => {
          if (decision === "decline") {
            const reason = payload?.reason ?? loc("این طرح در ماده فعلی قابل ساخت نیست.", "This design cannot be made in the current material.");
            return withMessage(
              touch(
                current,
                { stage: "declined", nextActor: "none" },
                {
                  actor: "artist",
                  stageId: "feasibility",
                  action: loc("طرح با دلیل رد شد", "Design declined with a reason"),
                },
              ),
              { stageId: "feasibility", author: "artist", body: reason },
            );
          }
          if (decision === "request_change" && payload?.change) {
            const change: ChangeRequest = {
              ...payload.change,
              id: newEntityId("c"),
              createdAt: Date.now(),
              status: "open",
            };
            return touch(
              {
                ...current,
                stage: "feasibility",
                nextActor: "customer",
                changeRequests: [...current.changeRequests, change],
              },
              {},
              {
                actor: "artist",
                stageId: "feasibility",
                action: loc("تغییر مشخص درخواست شد", "A specific change was requested"),
              },
            );
          }
          if (decision === "offer_alternative") {
            const alternative =
              payload?.alternative ??
              loc("بدیلی ساده‌تر با همین حس پیشنهاد می‌شود.", "A simpler alternative with the same feeling is offered.");
            return withMessage(
              touch(
                current,
                { stage: "feasibility", nextActor: "customer" },
                {
                  actor: "artist",
                  stageId: "feasibility",
                  action: loc("بدیل پیشنهاد شد", "An alternative was offered"),
                },
              ),
              { stageId: "feasibility", author: "artist", body: alternative },
            );
          }
          return touch(
            current,
            { stage: "quote", nextActor: "artist" },
            {
              actor: "artist",
              stageId: "feasibility",
              action: loc("طرح تأیید شد", "Design approved"),
            },
          );
        });
      },
      customerResolveChange: (id, accept, note) => {
        update(id, (current) => {
          const changeRequests = current.changeRequests.map((item) =>
            item.status === "open"
              ? { ...item, status: accept ? ("accepted" as const) : ("withdrawn" as const) }
              : item,
          );
          const next = touch(
            { ...current, changeRequests, stage: "quote", nextActor: "artist" },
            {},
            {
              actor: "customer",
              stageId: "feasibility",
              action: accept
                ? loc("تغییر پذیرفته شد", "Change accepted")
                : loc("تغییر رد شد؛ هنرمند بدیل می‌نویسد", "Change declined; artist will write an alternative"),
            },
          );
          return note
            ? withMessage(next, { stageId: "feasibility", author: "customer", body: note })
            : next;
        });
      },
      artistSendQuote: (id, quote) => {
        update(id, (current) =>
          touch(
            {
              ...current,
              quote,
              stage: "approval_deposit",
              nextActor: "customer",
              payments: [
                {
                  id: newEntityId("pay"),
                  kind: "deposit",
                  status: "due",
                  amountToman: quote.depositToman,
                  amountUsd: quote.depositUsd,
                },
                {
                  id: newEntityId("pay"),
                  kind: "balance",
                  status: "due",
                  amountToman: quote.priceToman - quote.depositToman,
                  amountUsd: quote.priceUsd - quote.depositUsd,
                },
              ],
            },
            {},
            {
              actor: "artist",
              stageId: "quote",
              action: loc("پیشنهاد و زمان‌بندی ارسال شد", "Quote and schedule sent"),
            },
          ),
        );
      },
      customerApproveDeposit: (id) => {
        update(id, (current) => {
          if (!current.quote) return current;
          return touch(
            {
              ...current,
              stage: "making",
              nextActor: "artist",
              approvedSnapshot: {
                quote: current.quote,
                brief: current.brief,
                approvedAt: Date.now(),
              },
              payments: current.payments.map((item) =>
                item.kind === "deposit" ? { ...item, status: "paid", at: Date.now() } : item,
              ),
            },
            {},
            {
              actor: "customer",
              stageId: "approval_deposit",
              action: loc("مشخصات تأیید و بیعانه پرداخت شد", "Specification accepted and deposit paid"),
            },
          );
        });
      },
      artistPublishUpdate: (id, input) => {
        update(id, (current) => {
          const stage: MakingStageId =
            current.stage === "making" || current.stage === "firing" || current.stage === "shipping"
              ? current.stage
              : current.stage;
          return {
            ...current,
            updatedAt: Date.now(),
            updates: [
              ...current.updates,
              {
                id: newEntityId("u"),
                stageId: stage,
                note: input.note,
                photoKind: input.photoKind,
                requiresApproval: Boolean(input.requiresApproval),
                createdAt: Date.now(),
              },
            ],
          };
        });
      },
      artistOpenPreKiln: (id, proposal) => {
        update(id, (current) =>
          touch(
            {
              ...current,
              preKiln: proposal,
              stage: "pre_kiln",
              nextActor: "customer",
              updates: [
                ...current.updates,
                {
                  id: newEntityId("u"),
                  stageId: "pre_kiln",
                  note: loc(
                    `لعاب ${proposal.glazeCode} پیشنهاد شد. رنگ دقیقاً همین نخواهد بود.`,
                    `Glaze ${proposal.glazeCode} proposed. Colour will not be exact.`,
                  ),
                  photoKind: "glaze",
                  requiresApproval: true,
                  createdAt: Date.now(),
                },
              ],
            },
            {},
            {
              actor: "artist",
              stageId: "pre_kiln",
              action: loc("ایستگاه پیش از کوره باز شد", "Pre-kiln checkpoint opened"),
            },
          ),
        );
      },
      customerApproveKiln: (id) => {
        update(id, (current) =>
          touch(
            { ...current, stage: "firing", nextActor: "artist", kilnLocked: true },
            {},
            {
              actor: "customer",
              stageId: "pre_kiln",
              action: loc("کوره تأیید شد — برگشت‌ناپذیر", "Kiln approved — irreversible"),
            },
          ),
        );
      },
      artistRecordFiring: (id, record) => {
        update(id, (current) =>
          touch(
            {
              ...current,
              firing: record,
              stage: record.unexpected ? "firing" : "reveal",
              nextActor: record.unexpected ? "customer" : "customer",
            },
            {},
            {
              actor: "artist",
              stageId: "firing",
              action: record.unexpected
                ? loc("نتیجه غیرمنتظره ثبت شد", "Unexpected result recorded")
                : loc("پخت و کنترل کیفیت ثبت شد", "Firing and quality control recorded"),
            },
          ),
        );
      },
      customerAcceptResolution: (id) => {
        update(id, (current) =>
          touch(
            { ...current, stage: "reveal", nextActor: "customer" },
            {},
            {
              actor: "customer",
              stageId: "firing",
              action: loc("مسیر حل اختلاف پذیرفته شد", "Resolution accepted"),
            },
          ),
        );
      },
      customerPayBalance: (id) => {
        update(id, (current) =>
          touch(
            {
              ...current,
              stage: "shipping",
              nextActor: "artist",
              payments: current.payments.map((item) =>
                item.kind === "balance" ? { ...item, status: "paid", at: Date.now() } : item,
              ),
            },
            {},
            {
              actor: "customer",
              stageId: "reveal",
              action: loc("مانده حساب پرداخت شد", "Balance paid"),
            },
          ),
        );
      },
      artistShip: (id, tracking) => {
        update(id, (current) =>
          touch(
            { ...current, tracking, stage: "complete", nextActor: "none" },
            {},
            {
              actor: "artist",
              stageId: "shipping",
              action: loc("ارسال شد", "Shipped"),
            },
          ),
        );
      },
    }),
    [commissions, ready, update],
  );

  return <MakingContext.Provider value={value}>{children}</MakingContext.Provider>;
}

export function useMaking() {
  const value = useContext(MakingContext);
  if (!value) throw new Error("useMaking must be used inside MakingProvider");
  return value;
}
