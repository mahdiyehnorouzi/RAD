import type {
  LocaleCopy,
  MakingCommission,
  MakingStageId,
  NextActor,
} from "@/components/making/type";

const BIOGRAPHY_STAGES: MakingStageId[] = [
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
export const STAGE_LABEL: Record<MakingStageId, LocaleCopy> = {
  design_submitted: { fa: "طرح به دست ما رسید", en: "Design received" },
  feasibility: { fa: "بررسی اینکه می‌شود ساخت", en: "Can this be made?" },
  quote: { fa: "قیمت و زمان ساخت", en: "Price and timing" },
  approval_deposit: {
    fa: "تأیید شما و پیش‌پرداخت",
    en: "Your approval and deposit",
  },
  making: { fa: "در حال ساخت", en: "Being made" },
  pre_kiln: { fa: "قبل از رفتن به کوره", en: "Before the kiln" },
  firing: { fa: "پخت در کوره", en: "In the kiln" },
  reveal: { fa: "دیدن کار تمام‌شده", en: "Seeing the finished piece" },
  shipping: { fa: "بسته‌بندی و ارسال", en: "Packing and shipping" },
  complete: { fa: "کار تمام شد", en: "Finished" },
  declined: { fa: "این طرح ساخته نمی‌شود", en: "This design will not be made" },
};

const ACTOR_LABEL: Record<NextActor, LocaleCopy> = {
  customer: { fa: "قدم بعدی با شماست", en: "The next step is yours" },
  artist: { fa: "قدم بعدی با سازنده است", en: "The next step is the maker’s" },
  none: { fa: "کار دیگری نمانده", en: "Nothing else is waiting" },
};

export function copy(value: LocaleCopy, locale: "fa" | "en") {
  return value[locale];
}

function stagesFor(commission: MakingCommission): MakingStageId[] {
  if (commission.stage === "declined") {
    return ["design_submitted", "feasibility", "declined"];
  }
  return BIOGRAPHY_STAGES;
}

export function stageProgress(commission: MakingCommission) {
  const stages = stagesFor(commission);
  const index = Math.max(0, stages.indexOf(commission.stage));
  const next = stages[index + 1];
  return {
    stages,
    index,
    total: stages.length,
    current: commission.stage,
    next,
    isLast: index >= stages.length - 1,
  };
}

export function moneyFor(
  commission: MakingCommission,
  locale: "fa" | "en",
  toman: number,
) {
  if (locale === "fa") {
    return `${new Intl.NumberFormat("fa-IR").format(toman)} تومان`;
  }
  return `${new Intl.NumberFormat("en-US").format(toman)} toman`;
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
  const openChange = commission.changeRequests.find(
    (item) => item.status === "open",
  );
  const glaze = commission.preKiln?.glazeCode;
  const artist = commission.artistName;

  if (commission.stage === "declined") {
    return {
      headline: {
        fa: "این طرح ساخته نمی‌شود",
        en: "This design will not be made",
      },
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
      headline: {
        fa: "تغییر مشخص لازم است",
        en: "A specific change is required",
      },
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
      headline: {
        fa: "طرح برای بازبینی هنرمند ارسال شد",
        en: "Design submitted for artist review",
      },
      body: {
        fa: "ایده، اندازه، جنس، کاربرد و بودجه ثبت شده است. سازنده حالا می‌بیند این کار شدنی است یا نه.",
        en: "Concept, dimensions, material, intended use, budget, and the generated image are on record. The artist now judges whether the piece can be made.",
      },
      next: {
        fa: "سازنده طرح را می‌پذیرد، یک تغییر مشخص می‌خواهد، راه دیگری پیشنهاد می‌دهد، یا با دلیل آن را نمی‌سازد.",
        en: "The artist will approve, request a change, offer an alternative, or decline with a reason.",
      },
    },
    feasibility: {
      headline: {
        fa: "در انتظار تصمیم هنرمند",
        en: "Waiting for the artist’s decision",
      },
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
      headline: {
        fa: "پیشنهاد در حال تنظیم است",
        en: "A proposal is being prepared",
      },
      body: {
        fa: "سازنده مشخصات نهایی، قیمت، پیش‌پرداخت، باقی‌مانده، زمان تحویل و شرط لغو را می‌نویسد.",
        en: "The artist is writing the final specification, price, deposit, balance, completion window, and cancellation rules.",
      },
      next: {
        fa: "پیشنهاد برای تأیید شما فرستاده می‌شود. ساخت فقط پس از پذیرش و بیعانه آغاز می‌شود.",
        en: "The proposal will be sent for your approval. Making begins only after acceptance and deposit.",
      },
    },
    approval_deposit: {
      headline: {
        fa: "تأیید مشخصات و پرداخت بیعانه",
        en: "Approve the specification and pay the deposit",
      },
      body: {
        fa: "این فقط یک عدد نیست. ساخت وقتی شروع می‌شود که مشخصات را بپذیرید و پیش‌پرداخت را بدهید. همان چیزی که تأیید کنید، مبنای ساخت می‌ماند.",
        en: "This is a full proposal, not only a number. Making begins only after you accept the specification and pay the deposit. Exactly what you approve is stored as an immutable snapshot.",
      },
      next: {
        fa: "پس از بیعانه، قطعه وارد مرحله ساخت می‌شود.",
        en: "After the deposit, the piece enters making.",
      },
    },
    making: {
      headline: {
        fa: "قطعه در حال شکل‌گرفتن است",
        en: "The piece is being formed",
      },
      body: {
        fa: `${artist} وضعیت را جلو می‌برد و می‌تواند عکس یا یادداشت کوتاه بگذارد. هر به‌روزرسانی نیاز به تأیید شما ندارد.`,
        en: `${artist} moves the order through making and may add photographs or short notes. Not every update needs your approval.`,
      },
      next: {
        fa: "وقتی شکل کار تمیز شد و لعاب پیشنهاد شد، قبل از کوره از شما تأیید می‌گیریم.",
        en: "When the form is cleaned and a glaze is proposed, the pre-kiln checkpoint opens.",
      },
    },
    pre_kiln: {
      headline: {
        fa: "تأیید پیش از کوره لازم است",
        en: "Pre-kiln approval required",
      },
      body: {
        fa: glaze
          ? `${artist} شکل کار را تمام کرده و لعاب ${glaze} را پیشنهاد داده است. عکس‌ها و اندازه را ببینید. بعد از تأیید شما، کار به کوره می‌رود و شکل و لعاب دیگر عوض نمی‌شود.`
          : `${artist} شکل کار را تمام کرده و لعاب را پیشنهاد داده است. عکس‌ها و اندازه را ببینید. بعد از تأیید شما، کار به کوره می‌رود و شکل و لعاب دیگر عوض نمی‌شود.`,
        en: glaze
          ? `${artist} has finished forming your piece and proposed glaze ${glaze}. Look at the photographs and the size. After you approve, it goes into the kiln and the form and glaze stay as they are.`
          : `${artist} has finished forming your piece and proposed a glaze. Look at the photographs and the size. After you approve, it goes into the kiln and the form and glaze stay as they are.`,
      },
      next: {
        fa: "تأیید شما کوره را برگشت‌ناپذیر می‌کند.",
        en: "Your approval marks the kiln step as irreversible.",
      },
    },
    firing: {
      headline: commission.firing?.unexpected
        ? {
            fa: "نتیجه پخت نیاز به تصمیم دارد",
            en: "The firing result needs a resolution",
          }
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
      headline: {
        fa: "رونمایی نهایی و مانده حساب",
        en: "Final reveal and remaining balance",
      },
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
      headline: {
        fa: "بسته‌بندی و رهگیری ارسال",
        en: "Packaging and shipment tracking",
      },
      body: {
        fa: "بیعانه و مانده پرداخت شده‌اند. هنرمند بسته‌بندی را ثبت می‌کند و شماره رهگیری را می‌گذارد.",
        en: "Deposit and balance are paid. The artist records packaging and adds tracking.",
      },
      next: {
        fa: "بعد از ارسال، شرح ساخت همین‌جا می‌ماند.",
        en: "After dispatch, the permanent Record of Making remains.",
      },
    },
    complete: {
      headline: {
        fa: "ساخت این کار تمام شد",
        en: "This piece’s Record of Making is complete",
      },
      body: {
        fa: "گفتگو، تصمیم‌های سازنده، لعاب، نتیجه پخت و عکس‌ها داستان این کار شده‌اند.",
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

export function deadlineWarning(
  commission: MakingCommission,
  now = Date.now(),
) {
  if (
    !commission.deadlineAt ||
    commission.stage === "complete" ||
    commission.stage === "declined"
  ) {
    return false;
  }
  return commission.deadlineAt - now < 3 * 24 * 60 * 60 * 1000;
}
