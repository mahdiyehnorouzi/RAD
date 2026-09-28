import type { PolicyDocument } from "../type";

/**
 * The studio page repeats a short form of these rules from
 * `studio/const/order-policy.ts`; publish a new version here when they change.
 */
export const CUSTOM_POLICY: PolicyDocument = {
  slug: "custom",
  kind: "guide",
  icon: "palette",
  title: { fa: "سفارش اختصاصی", en: "Custom orders" },
  summary: {
    fa: "از ایده تا ساخت؛ بیعانه، اصلاح طرح، لغو و تفاوت نتیجه.",
    en: "From idea to making: deposit, revisions, cancelling and how the result may differ.",
  },
  versions: [
    {
      id: "2026-09-27",
      change: { fa: "نخستین نسخه‌ی منتشرشده.", en: "First published version." },
      points: [
        {
          id: "price",
          label: { fa: "قیمت", en: "Price" },
          value: {
            fa: "بعد از بررسی ایده و پیش از هر پرداخت اعلام می‌شود",
            en: "Given after we review the idea, before any payment",
          },
        },
        {
          id: "time",
          label: { fa: "زمان ساخت", en: "Making time" },
          value: {
            fa: "معمولاً ۲ تا ۳ هفته از پرداخت بیعانه",
            en: "Usually 2–3 weeks from the deposit",
          },
        },
        {
          id: "revisions",
          label: { fa: "اصلاح طرح", en: "Revisions" },
          value: {
            fa: "تا ۲ بار پیش از شروع ساخت",
            en: "Up to 2 before making starts",
          },
        },
        {
          id: "cancel",
          label: { fa: "لغو", en: "Cancelling" },
          value: {
            fa: "تا پیش از تأیید و بیعانه، بدون هزینه",
            en: "Free until approval and deposit",
          },
        },
      ],
      sections: [
        {
          id: "path",
          title: { fa: "مسیر سفارش", en: "How an order moves" },
          blocks: [
            {
              kind: "steps",
              items: [
                {
                  fa: "ایده، مرجع‌ها و جزئیاتت را می‌خوانیم و می‌بینیم ساختنی است یا نه.",
                  en: "We read your idea, references and details, and check it can be made.",
                },
                {
                  fa: "پیشنهاد رَد را می‌فرستیم: قیمت، زمان ساخت، جزئیات اجرا و مبلغ بیعانه.",
                  en: "We send the RAD proposal: price, making time, how it will be made and the deposit.",
                },
                {
                  fa: "اگر همه‌چیز را پذیرفتی، سفارش را تأیید می‌کنی.",
                  en: "If everything works for you, you approve the order.",
                },
                {
                  fa: "با پرداخت بیعانه، ساخت شروع می‌شود و مراحلش را با تو به اشتراک می‌گذاریم.",
                  en: "Once the deposit is paid, making begins and we share each stage with you.",
                },
                {
                  fa: "اثر بررسی نهایی می‌شود، مانده‌ی حساب را می‌پردازی و ارسال می‌شود.",
                  en: "The piece gets a final check, you pay the balance, and it ships.",
                },
              ],
            },
          ],
        },
        {
          id: "price",
          title: { fa: "قیمت و بیعانه", en: "Price and deposit" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "قیمت‌های صفحه‌ی سفارش اختصاصی نقطه‌ی شروع‌اند. قیمت نهایی به ابعاد، ماده، جزئیات و پیچیدگی بستگی دارد و در پیشنهاد رَد، پیش از هر پرداختی، به تو گفته می‌شود.",
                en: "The prices on the custom-order page are starting points. The final price depends on size, material, detail and complexity, and is given in the RAD proposal before you pay anything.",
              },
            },
            {
              kind: "p",
              text: {
                fa: "ساخت با پرداخت بیعانه شروع می‌شود. مبلغ بیعانه در پیشنهاد رَد نوشته می‌شود و مانده‌ی حساب پیش از ارسال اثر پرداخت می‌شود.",
                en: "Making starts once the deposit is paid. The deposit is written in the RAD proposal, and the balance is paid before the piece ships.",
              },
            },
          ],
        },
        {
          id: "revisions",
          title: { fa: "اصلاح طرح و تغییرات", en: "Revisions and changes" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "پیش از شروع ساخت، فرم، رنگ و جزئیات را با هم نهایی می‌کنیم. تا ۲ بار اصلاح طرح در این مرحله جزو سفارش است.",
                en: "Before making starts, we settle form, colour and details together. Up to 2 design revisions are included at that stage.",
              },
            },
            {
              kind: "p",
              text: {
                fa: "بعد از شروع ساخت، تغییر اساسی ممکن است شدنی نباشد یا هزینه و زمان بیشتری بخواهد. اگر تغییری لازم شود، پیش از انجامش اثرش بر قیمت و زمان را برایت می‌نویسیم و فقط با تأیید تو انجام می‌شود.",
                en: "After making starts, a major change may not be possible or may cost more time and money. If a change is needed, we first write down how it affects price and timing, and only go ahead with your approval.",
              },
            },
          ],
        },
        {
          id: "difference",
          title: { fa: "تفاوت نتیجه با مرجع", en: "How the result can differ" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "رَد نسخه‌ی عینی یک عکس را نمی‌سازد. ایده از دست سازنده و ماده می‌گذرد و این عبور ردش را روی اثر می‌گذارد.",
                en: "RAD does not make an exact copy of a photo. The idea passes through a maker's hands and a material, and that passage leaves its trace on the piece.",
              },
            },
            {
              kind: "p",
              text: {
                fa: "در سرامیک، پخت در کوره رنگ، لعاب و بافت را کمی تغییر می‌دهد؛ چوب، پارچه و رنگ هم رفتار خودشان را دارند. پیش از ساخت درباره‌ی این تفاوت‌ها با تو حرف می‌زنیم و این تفاوت‌های طبیعی عیب حساب نمی‌شوند.",
                en: "In ceramics, kiln firing shifts colour, glaze and texture slightly; wood, textile and paint behave in their own ways too. We talk these through before making, and such natural differences are not defects.",
              },
            },
            {
              kind: "note",
              text: {
                fa: "آنچه تفاوت طبیعی نیست: اندازه، فرم یا رنگی که با پیشنهاد تأییدشده فرق اساسی داشته باشد. در این حالت اثر را اصلاح می‌کنیم یا دوباره می‌سازیم، و اگر ممکن نبود، مبلغ پرداختی برمی‌گردد.",
                en: "What is not a natural difference: a size, form or colour that departs substantially from the approved proposal. Then we correct or remake the piece, and if that isn't possible, your payment is returned.",
              },
            },
          ],
        },
        {
          id: "cancel",
          title: { fa: "اگر نظرم عوض شد؟", en: "What if I change my mind?" },
          blocks: [
            {
              kind: "list",
              items: [
                {
                  fa: "تا پیش از تأیید نهایی و پرداخت بیعانه: لغو آزاد و بدون هزینه است.",
                  en: "Before final approval and the deposit: cancelling is free.",
                },
                {
                  fa: "بعد از شروع ساخت: هزینه‌ی مواد و کاری که تا آن لحظه انجام شده از بیعانه کم می‌شود و باقی‌مانده برمی‌گردد.",
                  en: "After making starts: the cost of materials and work done so far is taken from the deposit, and the rest is returned.",
                },
                {
                  fa: "بعد از پایان ساخت: چون اثر فقط برای تو ساخته شده، لغو ممکن نیست.",
                  en: "After the piece is finished: because it was made only for you, it can no longer be cancelled.",
                },
              ],
            },
          ],
        },
        {
          id: "returns",
          title: { fa: "بازگشت بعد از تحویل", en: "Returns after delivery" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "سفارش اختصاصی بر اساس مشخصات شخصی تو ساخته می‌شود؛ برای همین مثل آثار آماده قابل بازگشت نیست. آسیب در ارسال، یا فرق اساسی با پیشنهاد تأییدشده، از این قاعده جداست.",
                en: "A custom piece is made to your personal specification, so it can't be returned like a ready work. Transit damage, or a substantial departure from the approved proposal, is the exception.",
              },
            },
          ],
        },
        {
          id: "shipping",
          title: { fa: "ارسال", en: "Shipping" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "اثر بعد از بررسی نهایی و پرداخت مانده‌ی حساب، با همان بسته‌بندی و بیمه‌ی آثار آماده به سراسر ایران ارسال می‌شود.",
                en: "After the final check and the balance, the piece ships across Iran with the same packing and insurance as ready works.",
              },
            },
          ],
        },
      ],
    },
  ],
};
