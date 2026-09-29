import type { PolicyDocument } from "../type";

export const BUYING_POLICY: PolicyDocument = {
  slug: "buying",
  kind: "guide",
  icon: "bag",
  title: { fa: "خرید آثار آماده", en: "Buying a ready work" },
  summary: {
    fa: "از انتخاب اثر تا پرداخت کارت‌به‌کارت و تأیید سفارش.",
    en: "From choosing a work to card-to-card payment and confirmation.",
  },
  versions: [
    {
      id: "2026-09-27",
      change: { fa: "نخستین نسخه‌ی منتشرشده.", en: "First published version." },
      points: [
        {
          id: "one-of-one",
          icon: "fingerprint",
          label: { fa: "هر اثر", en: "Every work" },
          value: {
            fa: "فقط یک نسخه؛ بعد از فروش دوباره ساخته نمی‌شود",
            en: "One copy only; never made again once sold",
          },
        },
        {
          id: "bag-hold",
          icon: "bag",
          label: { fa: "نگه‌داری در سبد", en: "Held in your bag" },
          value: { fa: "۱۵ دقیقه", en: "15 minutes" },
        },
        {
          id: "payment-window",
          icon: "clock",
          label: {
            fa: "مهلت واریز و ارسال رسید",
            en: "Time to pay and send the receipt",
          },
          value: {
            fa: "۳۰ دقیقه پس از ثبت سفارش",
            en: "30 minutes after placing the order",
          },
        },
        {
          id: "final-price",
          icon: "receipt",
          label: { fa: "مبلغ نهایی", en: "Final amount" },
          value: {
            fa: "همان قیمت اثر؛ ارسال رایگان است",
            en: "The work's price; shipping is free",
          },
        },
      ],
      sections: [
        {
          id: "one-of-one",
          title: {
            fa: "هر اثر فقط یک نسخه دارد",
            en: "Every work exists once",
          },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "هر اثر رَد یک‌بار ساخته می‌شود و شماره‌ی ثابت RĀD / NNN دارد. وقتی کسی آن را بخرد، از فروشگاه برداشته می‌شود و در آرشیو می‌ماند؛ نسخه‌ی دوم یا مشابه دقیقش ساخته نمی‌شود.",
                en: "Every RAD work is made once and carries a permanent RĀD / NNN number. Once someone buys it, it leaves the shop and stays in the archive; no second or identical copy is made.",
              },
            },
            {
              kind: "note",
              text: {
                fa: "نمایشگرها رنگ و بافت را کمی متفاوت نشان می‌دهند. اگر درباره‌ی رنگ، ابعاد یا جزئیات اثری شک داری، پیش از خرید بپرس؛ خوشحال می‌شویم عکس یا توضیح بیشتری بفرستیم.",
                en: "Screens show colour and texture slightly differently. If you are unsure about a work's colour, size or detail, ask before buying — we are glad to send more photos or notes.",
              },
            },
          ],
        },
        {
          id: "bag",
          title: { fa: "سبد خرید و نگه‌داری اثر", en: "Your bag and the hold" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "وقتی اثری را به سبد اضافه می‌کنی، ۱۵ دقیقه برای تو کنار گذاشته می‌شود تا کس دیگری نتواند آن را بخرد. اگر در این مدت سفارش را ثبت نکنی، اثر دوباره در فروشگاه قرار می‌گیرد.",
                en: "When you add a work to your bag, it is set aside for you for 15 minutes so nobody else can buy it. If you don't place the order in that time, the work goes back on sale.",
              },
            },
            {
              kind: "p",
              text: {
                fa: "قیمت هر اثر همان است که روی صفحه‌اش می‌بینی. اگر قیمت بعد از اضافه‌شدن به سبد تغییر کند، پیش از پرداخت در سبد به تو نشان داده می‌شود.",
                en: "A work's price is the one on its page. If it changes after you add it to your bag, the bag tells you before you pay.",
              },
            },
          ],
        },
        {
          id: "payment",
          title: { fa: "پرداخت کارت‌به‌کارت", en: "Card-to-card payment" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "درگاه پرداخت آنلاین هنوز فعال نیست؛ پرداخت فعلاً کارت‌به‌کارت انجام می‌شود:",
                en: "Online payment is not live yet; for now you pay by card-to-card transfer:",
              },
            },
            {
              kind: "steps",
              items: [
                {
                  fa: "سفارش را ثبت می‌کنی؛ اثر ۳۰ دقیقه برایت رزرو می‌شود.",
                  en: "You place the order; the work is reserved for you for 30 minutes.",
                },
                {
                  fa: "مبلغ دقیق سفارش را به کارتی که در صفحه‌ی سفارش می‌بینی واریز می‌کنی.",
                  en: "You transfer the exact order amount to the card shown on your order page.",
                },
                {
                  fa: "تصویر رسید و شماره‌ی پیگیری واریز را در همان صفحه می‌فرستی.",
                  en: "You send the receipt image and the transfer's tracking number on the same page.",
                },
              ],
            },
            {
              kind: "note",
              text: {
                fa: "با فرستادن رسید، مهلت ۳۰ دقیقه‌ای متوقف می‌شود و اثر تا پایان بررسی برای تو می‌ماند. اگر مهلت تمام شود و رسیدی نرسیده باشد، سفارش منقضی و اثر به فروشگاه برمی‌گردد.",
                en: "Sending the receipt stops the 30-minute clock and the work stays yours until the review ends. If the time runs out with no receipt, the order expires and the work returns to the shop.",
              },
            },
          ],
        },
        {
          id: "confirmation",
          title: { fa: "تأیید سفارش", en: "How the order is confirmed" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "یک نفر از رَد رسید را با واریزی حساب تطبیق می‌دهد. اگر مبلغ و شماره‌ی پیگیری درست باشد، سفارش «تأیید شد» می‌شود و خبرش را در صفحه‌ی سفارش و اعلان‌ها می‌بینی.",
                en: "A person at RAD checks the receipt against the account. If the amount and tracking number match, the order becomes “confirmed” and you see it on your order page and in notifications.",
              },
            },
            {
              kind: "p",
              text: {
                fa: "اگر رسید با واریز نخواند — مثلاً مبلغ فرق کند یا رسید قبلاً برای سفارش دیگری فرستاده شده باشد — دلیلش را در صفحه‌ی سفارش می‌نویسیم. تا وقتی سفارش در حال بررسی است، می‌توانی رسید را عوض کنی.",
                en: "If the receipt doesn't match — say the amount differs, or it was already sent for another order — we write the reason on your order page. While the order is under review, you can replace the receipt.",
              },
            },
            {
              kind: "p",
              text: {
                fa: "اگر پرداخت تأیید نشود، اثر به فروشگاه برمی‌گردد. اگر مبلغی واریز کرده‌ای که به سفارشی نرسیده، با شماره‌ی سفارش پیام بده؛ پس از بررسی به همان کارت برگردانده می‌شود.",
                en: "If the payment isn't confirmed, the work returns to the shop. If you transferred money that didn't reach an order, message us with the order number; once checked, it goes back to the same card.",
              },
            },
          ],
        },
        {
          id: "cancel",
          title: { fa: "لغو پیش از پرداخت", en: "Cancelling before you pay" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "تا وقتی رسید نفرستاده‌ای، می‌توانی سفارش را از صفحه‌ی سفارش لغو کنی؛ هزینه‌ای ندارد. بعد از فرستادن رسید، برای لغو به ما پیام بده.",
                en: "Until you send a receipt, you can cancel the order from its page at no cost. After sending the receipt, message us to cancel.",
              },
            },
          ],
        },
        {
          id: "after",
          title: { fa: "بعد از تأیید", en: "After confirmation" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "اثر بسته‌بندی و ارسال می‌شود و هر مرحله را در صفحه‌ی سفارش می‌بینی. زمان‌ها و بسته‌بندی در راهنمای «ارسال و تحویل» آمده و بازگشت و آسیب در راهنمای «مرجوعی و آسیب».",
                en: "The work is packed and shipped, and you can follow each step on your order page. Timing and packaging are in the “Shipping and delivery” guide; returns and damage in “Returns and damage”.",
              },
            },
          ],
        },
      ],
    },
  ],
};
