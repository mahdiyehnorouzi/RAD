export type LocaleCopy = { fa: string; en: string };
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

export const BIOGRAPHY_STAGES: MakingStageId[] = [
  "design_submitted",
  "feasibility",
  "quote",
  "approval_deposit",
  "making",
  "pre_kiln",
  "firing",
  "reveal",
  "shipping",
  "complete",
];

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

export const STAGE_LABEL: Record<MakingStageId, LocaleCopy> = {
  design_submitted: { fa: "طرح ارسال شد", en: "Design submitted" },
  feasibility: { fa: "بازبینی امکان‌پذیری", en: "Artist feasibility review" },
  quote: { fa: "پیشنهاد و زمان‌بندی", en: "Quote and schedule" },
  approval_deposit: { fa: "تأیید مشتری و بیعانه", en: "Customer approval and deposit" },
  making: { fa: "ساخت", en: "Making" },
  pre_kiln: { fa: "ایستگاه پیش از کوره", en: "Pre-kiln checkpoint" },
  firing: { fa: "پخت و پرداخت", en: "Firing and finishing" },
  reveal: { fa: "رونمایی و مانده حساب", en: "Final reveal and payment" },
  shipping: { fa: "بسته‌بندی و ارسال", en: "Packaging and shipping" },
  complete: { fa: "رکورد ساخت", en: "Record of Making" },
  declined: { fa: "رد شده", en: "Declined" },
};

const ACTOR_LABEL: Record<NextActor, LocaleCopy> = {
  customer: { fa: "مشتری باید اقدام کند", en: "The customer needs to act" },
  artist: { fa: "هنرمند باید اقدام کند", en: "The artist needs to act" },
  none: { fa: "اقدام دیگری لازم نیست", en: "No further action" },
};

export function copy(value: LocaleCopy, locale: "fa" | "en") {
  return value[locale];
}

export function stageIndex(stage: MakingStageId) {
  const index = BIOGRAPHY_STAGES.indexOf(stage);
  return index < 0 ? -1 : index;
}

export function moneyFor(commission: MakingCommission, locale: "fa" | "en", toman: number, usd: number) {
  if (locale === "fa") {
    return `${new Intl.NumberFormat("fa-IR").format(toman)} تومان`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(usd);
}

export function situationFor(commission: MakingCommission): {
  headline: LocaleCopy;
  body: LocaleCopy;
  stageLabel: LocaleCopy;
  actorLabel: LocaleCopy;
  nextLabel: LocaleCopy;
} {
  const stageLabel = STAGE_LABEL[commission.stage];
  const actorLabel = ACTOR_LABEL[commission.nextActor];
  const openChange = commission.changeRequests.find((item) => item.status === "open");
  const glaze = commission.preKiln?.glazeCode ?? "G-17";
  const artist = commission.artistName;

  if (commission.stage === "declined") {
    return {
      headline: { fa: "این طرح ساخته نمی‌شود", en: "This design will not be made" },
      body: {
        fa: `${artist} این سفارش را رد کرده است. دلیل در همین مرحله ثبت شده است.`,
        en: `${artist} declined this commission. The reason is attached to this stage.`,
      },
      stageLabel,
      actorLabel,
      nextLabel: {
        fa: "می‌توانید طرح تازه‌ای از استودیو بفرستید.",
        en: "You can submit a new design from the studio.",
      },
    };
  }

  if (openChange) {
    return {
      headline: { fa: "تغییر مشخص لازم است", en: "A specific change is required" },
      body: {
        fa: `${artist} طرح را دیده و یک تغییر مشخص پیشنهاد کرده است. ببینید چه چیزی عوض می‌شود، چرا لازم است، و آیا قیمت یا زمان را جابه‌جا می‌کند.`,
        en: `${artist} has reviewed the design and requested a specific change. See what changes, why it is necessary, and whether price or delivery is affected.`,
      },
      stageLabel,
      actorLabel,
      nextLabel: {
        fa: "پس از پذیرش یا گفت‌وگو، هنرمند پیشنهاد قیمت می‌فرستد.",
        en: "After you accept or discuss, the artist will send a quote.",
      },
    };
  }

  const table: Record<
    MakingStageId,
    { headline: LocaleCopy; body: LocaleCopy; next: LocaleCopy }
  > = {
    design_submitted: {
      headline: { fa: "طرح برای بازبینی هنرمند ارسال شد", en: "Design submitted for artist review" },
      body: {
        fa: "مفهوم، ابعاد، ماده، کاربرد، بودجه و تصویر تولیدشده ثبت شده‌اند. هنرمند حالا امکان ساخت را می‌سنجد.",
        en: "Concept, dimensions, material, intended use, budget, and the generated image are on record. The artist now judges whether the piece can be made.",
      },
      next: {
        fa: "هنرمند طرح را تأیید می‌کند، تغییر می‌خواهد، بدیل پیشنهاد می‌دهد، یا با دلیل رد می‌کند.",
        en: "The artist will approve, request a change, offer an alternative, or decline with a reason.",
      },
    },
    feasibility: {
      headline: { fa: "در انتظار تصمیم هنرمند", en: "Waiting for the artist’s decision" },
      body: {
        fa: `${artist} در حال سنجش امکان ساخت است؛ هنوز ساخت آغاز نشده.`,
        en: `${artist} is judging feasibility. Making has not begun.`,
      },
      next: {
        fa: "پس از تأیید، پیشنهاد قیمت و زمان‌بندی نوشته می‌شود.",
        en: "After approval, a quote and schedule will be written.",
      },
    },
    quote: {
      headline: { fa: "پیشنهاد در حال تنظیم است", en: "A proposal is being prepared" },
      body: {
        fa: "هنرمند مشخصات نهایی، قیمت، بیعانه، مانده، پنجره تکمیل و قواعد لغو را می‌نویسد.",
        en: "The artist is writing the final specification, price, deposit, balance, completion window, and cancellation rules.",
      },
      next: {
        fa: "پیشنهاد برای تأیید شما فرستاده می‌شود. ساخت فقط پس از پذیرش و بیعانه آغاز می‌شود.",
        en: "The proposal will be sent for your approval. Making begins only after acceptance and deposit.",
      },
    },
    approval_deposit: {
      headline: { fa: "تأیید مشخصات و پرداخت بیعانه", en: "Approve the specification and pay the deposit" },
      body: {
        fa: "این یک پیشنهاد کامل است، نه فقط یک عدد. ساخت تنها پس از پذیرش مشخصات و پرداخت بیعانه آغاز می‌شود. آنچه تأیید کنید به‌صورت غیرقابل‌تغییر ذخیره می‌شود.",
        en: "This is a full proposal, not only a number. Making begins only after you accept the specification and pay the deposit. Exactly what you approve is stored as an immutable snapshot.",
      },
      next: {
        fa: "پس از بیعانه، قطعه وارد مرحله ساخت می‌شود.",
        en: "After the deposit, the piece enters making.",
      },
    },
    making: {
      headline: { fa: "قطعه در حال شکل‌گرفتن است", en: "The piece is being formed" },
      body: {
        fa: `${artist} وضعیت را جلو می‌برد و می‌تواند عکس یا یادداشت کوتاه بگذارد. هر به‌روزرسانی نیاز به تأیید شما ندارد.`,
        en: `${artist} moves the order through making and may add photographs or short notes. Not every update needs your approval.`,
      },
      next: {
        fa: "وقتی فرم پاک شد و لعاب پیشنهاد شد، ایستگاه پیش از کوره باز می‌شود.",
        en: "When the form is cleaned and a glaze is proposed, the pre-kiln checkpoint opens.",
      },
    },
    pre_kiln: {
      headline: { fa: "تأیید پیش از کوره لازم است", en: "Pre-kiln approval required" },
      body: {
        fa: `${artist} فرم‌دهی را تمام کرده و لعاب ${glaze} را پیشنهاد داده است. عکس‌ها، ابعاد و بازه رنگ مورد انتظار را ببینید. پس از تأیید، قطعه وارد کوره می‌شود و فرم و لعاب دیگر تغییرپذیر نیستند.`,
        en: `${artist} has finished forming your piece and proposed glaze ${glaze}. Review the photographs and expected colour range. Once approved, the piece will enter the kiln and its form and glaze cannot be changed.`,
      },
      next: {
        fa: "تأیید شما کوره را برگشت‌ناپذیر می‌کند.",
        en: "Your approval marks the kiln step as irreversible.",
      },
    },
    firing: {
      headline: commission.firing?.unexpected
        ? { fa: "نتیجه پخت نیاز به تصمیم دارد", en: "The firing result needs a resolution" }
        : { fa: "پخت در جریان است", en: "Firing and finishing are underway" },
      body: commission.firing?.unexpected
        ? {
            fa: "نتیجه از بازه تأییدشده فاصله گرفته است. این سفارش به‌جای درخواست خودکار مانده حساب، وارد مسیر حل اختلاف می‌شود.",
            en: "The result differs materially from the approved range. This order enters a resolution flow rather than automatically requesting final payment.",
          }
        : {
            fa: `${artist} پخت، پرداخت و کنترل کیفیت را ثبت می‌کند. رنگ سرامیک در آتش جابه‌جا می‌شود؛ این انتظار است نه نقص.`,
            en: `${artist} records firing, finishing, and quality control. Ceramic colour can shift in the fire; that variation is expected.`,
          },
      next: commission.firing?.unexpected
        ? {
            fa: "پس از توافق، رونمایی و مانده حساب باز می‌شود — یا مسیر دیگری ثبت می‌شود.",
            en: "After agreement, the reveal and balance open — or another path is recorded.",
          }
        : {
            fa: "پس از کنترل کیفیت، عکس نهایی و مانده حساب نمایش داده می‌شود.",
            en: "After quality control, finished photographs and the remaining balance are shown.",
          },
    },
    reveal: {
      headline: { fa: "رونمایی نهایی و مانده حساب", en: "Final reveal and remaining balance" },
      body: {
        fa: "عکس تمام‌شده، تاریخچه ساخت و مانده حساب اینجاست. پس از پرداخت، سفارش به بسته‌بندی و ارسال می‌رود.",
        en: "Finished photographs, the making history, and the remaining balance are here. After payment, the order moves to packaging and shipping.",
      },
      next: {
        fa: "پرداخت مانده، ارسال را آزاد می‌کند.",
        en: "Paying the balance releases packaging and shipping.",
      },
    },
    shipping: {
      headline: { fa: "بسته‌بندی و رهگیری ارسال", en: "Packaging and shipment tracking" },
      body: {
        fa: "بیعانه و مانده پرداخت شده‌اند. هنرمند بسته‌بندی را ثبت می‌کند و شماره رهگیری را می‌گذارد.",
        en: "Deposit and balance are paid. The artist records packaging and adds tracking.",
      },
      next: {
        fa: "پس از ارسال، رکورد ساخت دائمی اثر باقی می‌ماند.",
        en: "After dispatch, the permanent Record of Making remains.",
      },
    },
    complete: {
      headline: { fa: "رکورد ساخت این قطعه کامل است", en: "This piece’s Record of Making is complete" },
      body: {
        fa: "گفت‌وگو، تصمیم‌های هنرمند، مرجع لعاب، نتیجه پخت و عکس‌ها زندگی‌نامه این اثر شده‌اند.",
        en: "The conversation, artist decisions, glaze reference, firing result, and photographs are now this piece’s biography.",
      },
      next: {
        fa: "گواهی و رهگیری در همین صفحه می‌مانند.",
        en: "The certificate and tracking stay on this page.",
      },
    },
    declined: {
      headline: { fa: "رد شده", en: "Declined" },
      body: { fa: "", en: "" },
      next: { fa: "", en: "" },
    },
  };

  const row = table[commission.stage];
  return {
    headline: row.headline,
    body: row.body,
    stageLabel,
    actorLabel,
    nextLabel: row.next,
  };
}

export function workshopBucket(commission: MakingCommission) {
  if (commission.stage === "declined" || commission.stage === "complete") {
    return "archive" as const;
  }
  if (commission.nextActor === "artist") return "needs_artist" as const;
  if (commission.nextActor === "customer") return "waiting_customer" as const;
  return "production" as const;
}

export function deadlineWarning(commission: MakingCommission, now = Date.now()) {
  if (!commission.deadlineAt || commission.stage === "complete" || commission.stage === "declined") {
    return false;
  }
  return commission.deadlineAt - now < 3 * 24 * 60 * 60 * 1000;
}

function loc(fa: string, en: string): LocaleCopy {
  return { fa, en };
}

function id(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

const saharQuote: QuoteProposal = {
  specification: loc(
    "کاسه سرامیکی متوسط با لبه نامتقارن، بدنه سنگ‌رس تهران، لعاب G-17 در بازه خاکستری‌سبز تا کهربایی گرم. کاربرد: سفره و نگاه روزمره. اجازه غافلگیری: دست هنرمند.",
    "A medium ceramic bowl with an asymmetric rim, Tehran stoneware body, glaze G-17 in a grey-green to warm amber range. Intended use: daily table and looking. Permission for surprise: artist’s hand.",
  ),
  artistName: "سحر میرزایی",
  priceToman: 18_400_000,
  priceUsd: 220,
  depositToman: 9_200_000,
  depositUsd: 110,
  completionWindow: loc("چهار تا شش هفته از بیعانه", "Four to six weeks from deposit"),
  includedRevisions: 1,
  cancellationRules: loc(
    "پیش از کوره، بیعانه پس از کسر مواد و زمان مصرف‌شده قابل استرداد است. پس از ورود به کوره، فرم و لعاب برگشت‌ناپذیرند و بیعانه قابل بازگشت نیست.",
    "Before the kiln, the deposit is refundable minus consumed material and time. Once the piece enters the kiln, form and glaze cannot be changed and the deposit is not refundable.",
  ),
  createdAt: now - 12 * day,
};

export const seedCommissions: MakingCommission[] = [
  {
    id: "RAD-M-1405-17",
    title: loc("کاسه خانه‌تنگی", "Homesickness bowl"),
    customerName: "مهدیه نوروزی",
    artistName: "سحر میرزایی",
    brief: {
      concept: "کاسه‌ای که حس خانه‌تنگی حیاط مادربزرگ را نگه دارد؛ لبه آرام، خاکی، نه تزئینی.",
      dimensions: "متوسط — حدود ۱۸ سانتی‌متر دهانه",
      material: "سنگ‌رس تهران، سطح مات",
      intendedUse: "سفره روزمره و نگاه روی طاقچه",
      budget: "۱۰ تا ۲۰ میلیون",
      permission: "دست هنرمند",
      category: "ceramics",
    },
    stage: "pre_kiln",
    nextActor: "customer",
    estimatedCompletion: now + 18 * day,
    deadlineAt: now + 2 * day,
    createdAt: now - 21 * day,
    updatedAt: now - 1 * day,
    kilnLocked: false,
    quote: saharQuote,
    approvedSnapshot: {
      quote: saharQuote,
      brief: {
        concept: "کاسه‌ای که حس خانه‌تنگی حیاط مادربزرگ را نگه دارد؛ لبه آرام، خاکی، نه تزئینی.",
        dimensions: "متوسط — حدود ۱۸ سانتی‌متر دهانه",
        material: "سنگ‌رس تهران، سطح مات",
        intendedUse: "سفره روزمره و نگاه روی طاقچه",
        budget: "۱۰ تا ۲۰ میلیون",
        permission: "دست هنرمند",
        category: "ceramics",
      },
      approvedAt: now - 11 * day,
    },
    payments: [
      {
        id: "pay-17-d",
        kind: "deposit",
        status: "paid",
        amountToman: 9_200_000,
        amountUsd: 110,
        at: now - 11 * day,
      },
      {
        id: "pay-17-b",
        kind: "balance",
        status: "due",
        amountToman: 9_200_000,
        amountUsd: 110,
      },
    ],
    changeRequests: [],
    preKiln: {
      dimensions: loc("دهانه ۱۷.۶ سانتی‌متر، بلندی ۸.۲ سانتی‌متر", "Rim 17.6 cm, height 8.2 cm"),
      glazeCode: "G-17",
      glazeName: loc("خاکستر زیتونی روی سنگ‌رس", "Olive ash over stoneware"),
      colorRange: loc(
        "از سبز خاکستری خنک تا کهربایی گرم؛ لبه ممکن است روشن‌تر بسوزد.",
        "Cool grey-green to warm amber; the rim may fire lighter.",
      ),
      testTileNote: loc(
        "کاشی آزمایشی همین دسته لعاب، پخت قبلی استودیو — مرجع است نه وعده تطابق.",
        "A photographed test tile from this glaze batch, previous studio firing — a reference, not a colour promise.",
      ),
      createdAt: now - 1 * day,
    },
    updates: [
      {
        id: "u-17-1",
        stageId: "making",
        note: loc("فرم روی چرخ گرفته شد؛ لبه کمی به داخل برگشت.", "Thrown on the wheel; the rim turns slightly inward."),
        photoKind: "forming",
        requiresApproval: false,
        createdAt: now - 8 * day,
      },
      {
        id: "u-17-2",
        stageId: "pre_kiln",
        note: loc("فرم خشک و پاک شده؛ آماده پیشنهاد لعاب.", "Form dried and cleaned; ready for the glaze proposal."),
        photoKind: "cleaned",
        requiresApproval: true,
        createdAt: now - 1 * day,
      },
      {
        id: "u-17-3",
        stageId: "pre_kiln",
        note: loc("کاشی آزمایشی G-17 از پخت پیشین.", "G-17 test tile from a previous firing."),
        photoKind: "tile",
        requiresApproval: false,
        createdAt: now - 1 * day,
      },
    ],
    messages: [
      {
        id: "m-17-1",
        stageId: "design_submitted",
        author: "customer",
        body: loc(
          "می‌خواهم وقتی کاسه را برمی‌دارم، حیاط را به یاد بیاورم؛ نه یک نقش تزئینی.",
          "I want the bowl to recall a courtyard when I lift it — not a decorative motif.",
        ),
        createdAt: now - 21 * day,
      },
      {
        id: "m-17-2",
        stageId: "feasibility",
        author: "artist",
        body: loc(
          "فرم ممکن است. لعاب را روی سنگ‌رس همین دسته آزمایش می‌کنم تا بازه رنگ مشخص شود.",
          "The form is possible. I will test the glaze on this clay batch so the colour range is honest.",
        ),
        createdAt: now - 19 * day,
      },
      {
        id: "m-17-3",
        stageId: "pre_kiln",
        author: "artist",
        body: loc(
          "رنگ دقیقاً همین نخواهد بود. آتش حرف آخر را می‌زند.",
          "It will not be exactly this colour. The kiln keeps the last word.",
        ),
        createdAt: now - 1 * day,
      },
    ],
    audit: [
      {
        id: "a-17-1",
        at: now - 21 * day,
        actor: "customer",
        stageId: "design_submitted",
        action: loc("طرح ارسال شد", "Design submitted"),
      },
      {
        id: "a-17-2",
        at: now - 19 * day,
        actor: "artist",
        stageId: "feasibility",
        action: loc("طرح تأیید شد", "Design approved"),
      },
      {
        id: "a-17-3",
        at: now - 12 * day,
        actor: "artist",
        stageId: "quote",
        action: loc("پیشنهاد قیمت ارسال شد", "Quote sent"),
      },
      {
        id: "a-17-4",
        at: now - 11 * day,
        actor: "customer",
        stageId: "approval_deposit",
        action: loc("مشخصات تأیید و بیعانه پرداخت شد", "Specification accepted and deposit paid"),
      },
      {
        id: "a-17-5",
        at: now - 1 * day,
        actor: "artist",
        stageId: "pre_kiln",
        action: loc("ایستگاه پیش از کوره باز شد", "Pre-kiln checkpoint opened"),
      },
    ],
    internalNotes: [
      {
        id: "n-17-1",
        stageId: "making",
        author: "artist",
        body: loc(
          "لبه را کمی ضخیم‌تر نگه دار؛ مشتری کاربرد روزانه دارد.",
          "Keep the rim a little thicker; the customer will use this daily.",
        ),
        createdAt: now - 8 * day,
        internal: true,
      },
    ],
  },
  {
    id: "RAD-M-1405-22",
    title: loc("دیوارکوب کوچه لوت", "Lut alley wall piece"),
    customerName: "رها احمدی",
    artistName: "سحر میرزایی",
    brief: {
      concept: "دیوارکوب سرامیکی با خطوط افقی شبیه حرارت کویر؛ شن و سایه.",
      dimensions: "بزرگ",
      material: "سفال و سرامیک، سطح خام",
      intendedUse: "دیوار ورودی خانه",
      budget: "بیش از ۲۰ میلیون",
      permission: "ماده تصمیم می‌گیرد",
      category: "ceramics",
    },
    stage: "design_submitted",
    nextActor: "artist",
    estimatedCompletion: now + 45 * day,
    deadlineAt: now + 1 * day,
    createdAt: now - 2 * day,
    updatedAt: now - 2 * day,
    kilnLocked: false,
    messages: [
      {
        id: "m-22-1",
        stageId: "design_submitted",
        author: "customer",
        body: loc(
          "نمی‌خواهم نقشه کویر باشد؛ می‌خواهم حرارت را حس کنم.",
          "I do not want a map of the desert. I want the heat to be felt.",
        ),
        createdAt: now - 2 * day,
      },
    ],
    changeRequests: [],
    updates: [
      {
        id: "u-22-0",
        stageId: "design_submitted",
        note: loc("تصویر تولیدشده همراه طرح ارسال شد.", "The generated image was submitted with the design."),
        photoKind: "concept",
        requiresApproval: false,
        createdAt: now - 2 * day,
      },
    ],
    payments: [],
    audit: [
      {
        id: "a-22-1",
        at: now - 2 * day,
        actor: "customer",
        stageId: "design_submitted",
        action: loc("طرح ارسال شد", "Design submitted"),
      },
    ],
    internalNotes: [],
  },
  {
    id: "RAD-M-1404-09",
    title: loc("ظرف زیتونی شماره ۰۹", "Olive vessel 09"),
    customerName: "کیمیا رضایی",
    artistName: "سحر میرزایی",
    brief: {
      concept: "ظرفی آرام برای شاخه‌های کوتاه؛ سطح مات زیتونی.",
      dimensions: "کوچک",
      material: "پرسلان شنی",
      intendedUse: "طاقچه و شاخه",
      budget: "تا ۱۰ میلیون",
      permission: "وفادار به طرح",
      category: "ceramics",
    },
    stage: "complete",
    nextActor: "none",
    estimatedCompletion: now - 40 * day,
    createdAt: now - 90 * day,
    updatedAt: now - 38 * day,
    tracking: "RAD-POST-8821",
    kilnLocked: true,
    quote: {
      ...saharQuote,
      priceToman: 9_600_000,
      priceUsd: 115,
      depositToman: 4_800_000,
      depositUsd: 58,
      createdAt: now - 80 * day,
    },
    approvedSnapshot: {
      quote: {
        ...saharQuote,
        priceToman: 9_600_000,
        priceUsd: 115,
        depositToman: 4_800_000,
        depositUsd: 58,
        createdAt: now - 80 * day,
      },
      brief: {
        concept: "ظرفی آرام برای شاخه‌های کوتاه؛ سطح مات زیتونی.",
        dimensions: "کوچک",
        material: "پرسلان شنی",
        intendedUse: "طاقچه و شاخه",
        budget: "تا ۱۰ میلیون",
        permission: "وفادار به طرح",
        category: "ceramics",
      },
      approvedAt: now - 78 * day,
    },
    payments: [
      {
        id: "pay-09-d",
        kind: "deposit",
        status: "paid",
        amountToman: 4_800_000,
        amountUsd: 58,
        at: now - 78 * day,
      },
      {
        id: "pay-09-b",
        kind: "balance",
        status: "paid",
        amountToman: 4_800_000,
        amountUsd: 57,
        at: now - 42 * day,
      },
    ],
    changeRequests: [],
    preKiln: {
      dimensions: loc("بلندی ۱۴ سانتی‌متر", "Height 14 cm"),
      glazeCode: "G-04",
      glazeName: loc("زیتون مات", "Matte olive"),
      colorRange: loc("زیتون خاکی تا قهوه‌ای گرم", "Earthy olive to warm brown"),
      testTileNote: loc("کاشی آزمایشی G-04", "G-04 test tile"),
      createdAt: now - 55 * day,
    },
    firing: {
      firingNote: loc("پخت مخروط ۶، کاهش ملایم.", "Cone 6, gentle reduction."),
      finishingNote: loc("پایه سنگ‌زنی شد؛ امضا زیر اثر.", "Foot stoned; signed underneath."),
      qcNote: loc("در بازه تأییدشده. یک لکه آهن روی شانه مانده است.", "Within the approved range. An iron speck remains on the shoulder."),
      unexpected: false,
      createdAt: now - 44 * day,
    },
    updates: [
      {
        id: "u-09-1",
        stageId: "making",
        note: loc("فرم گرفته شد.", "Form thrown."),
        photoKind: "forming",
        requiresApproval: false,
        createdAt: now - 70 * day,
      },
      {
        id: "u-09-2",
        stageId: "reveal",
        note: loc("اثر تمام شد.", "The piece is finished."),
        photoKind: "finished",
        requiresApproval: false,
        createdAt: now - 42 * day,
      },
      {
        id: "u-09-3",
        stageId: "shipping",
        note: loc("بسته‌بندی دو لایه با conservator wrap.", "Double-wrapped for transit."),
        photoKind: "packed",
        requiresApproval: false,
        createdAt: now - 38 * day,
      },
    ],
    messages: [
      {
        id: "m-09-1",
        stageId: "reveal",
        author: "artist",
        body: loc(
          "لکه آهن را نگه داشتم؛ بخشی از رفتار همین خاک است.",
          "I kept the iron speck. It belongs to this clay.",
        ),
        createdAt: now - 42 * day,
      },
    ],
    audit: [
      {
        id: "a-09-1",
        at: now - 90 * day,
        actor: "customer",
        stageId: "design_submitted",
        action: loc("طرح ارسال شد", "Design submitted"),
      },
      {
        id: "a-09-2",
        at: now - 78 * day,
        actor: "customer",
        stageId: "approval_deposit",
        action: loc("بیعانه پرداخت شد", "Deposit paid"),
      },
      {
        id: "a-09-3",
        at: now - 50 * day,
        actor: "customer",
        stageId: "pre_kiln",
        action: loc("کوره تأیید شد", "Kiln approved"),
      },
      {
        id: "a-09-4",
        at: now - 42 * day,
        actor: "customer",
        stageId: "reveal",
        action: loc("مانده حساب پرداخت شد", "Balance paid"),
      },
      {
        id: "a-09-5",
        at: now - 38 * day,
        actor: "artist",
        stageId: "shipping",
        action: loc("ارسال شد", "Shipped"),
      },
    ],
    internalNotes: [],
  },
];

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
