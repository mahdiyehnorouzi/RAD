import type { PolicyDocument } from "../type";
import { RETURN_WINDOW_REVIEW } from "./policy-returns";

export const TERMS_POLICY: PolicyDocument = {
  slug: "terms",
  kind: "legal",
  icon: "scale",
  title: { fa: "شرایط استفاده و خرید", en: "Terms of use and sale" },
  summary: {
    fa: "متن رسمی شرایط استفاده از سایت و خرید از رَد.",
    en: "The official terms for using the site and buying from RAD.",
  },
  versions: [
    {
      id: "2026-09-27",
      change: { fa: "نخستین نسخه‌ی منتشرشده.", en: "First published version." },
      points: [
        {
          id: "contract",
          icon: "check",
          label: { fa: "قطعی شدن خرید", en: "When a sale is final" },
          value: {
            fa: "با تأیید پرداخت از سوی رَد",
            en: "When RAD confirms the payment",
          },
        },
        {
          id: "version",
          icon: "history",
          label: { fa: "نسخه‌ی معتبر", en: "Which version applies" },
          value: {
            fa: "نسخه‌ای که هنگام ثبت سفارش پذیرفته‌ای",
            en: "The one you accepted when ordering",
          },
        },
        {
          id: "favour",
          icon: "scale",
          label: { fa: "اگر متن‌ها فرق داشتند", en: "If texts disagree" },
          value: {
            fa: "تفسیر به نفع خریدار ملاک است",
            en: "The reading that favours the buyer applies",
          },
        },
      ],
      sections: [
        {
          id: "about",
          title: { fa: "درباره‌ی این شرایط", en: "About these terms" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "این شرایط رابطه‌ی میان استودیو رَد («رَد») و هر کسی که از وب‌سایت رَد استفاده می‌کند یا از آن خرید می‌کند («کاربر» یا «خریدار») را تعیین می‌کند. استفاده از سایت و ثبت سفارش به معنی پذیرش این شرایط است.",
                en: "These terms govern the relationship between RAD Studio (“RAD”) and anyone who uses or buys from the RAD website (the “user” or “buyer”). Using the site and placing an order means accepting them.",
              },
            },
            {
              kind: "p",
              text: {
                fa: "راهنماهای «خرید آثار آماده»، «سفارش اختصاصی»، «ارسال و تحویل» و «مرجوعی و آسیب» بخشی از همین شرایط‌اند. اگر میان متن ساده‌ی راهنماها و این متن تفاوتی دیده شود، تفسیری که به نفع خریدار است ملاک است.",
                en: "The “Buying a ready work”, “Custom orders”, “Shipping and delivery” and “Returns and damage” guides form part of these terms. Where their plain-language wording and this text differ, the reading more favourable to the buyer applies.",
              },
            },
          ],
        },
        {
          id: "account",
          title: { fa: "حساب کاربری", en: "Accounts" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "خرید آثار آماده بدون ساختن حساب هم ممکن است؛ ثبت سفارش اختصاصی به حساب کاربری نیاز دارد. کاربر مسئول درستی اطلاعاتی است که وارد می‌کند و نگه‌داری از رمز عبور حساب با خود اوست.",
                en: "Ready works can be bought without an account; custom orders need one. Users are responsible for the accuracy of the information they enter and for keeping their password safe.",
              },
            },
          ],
        },
        {
          id: "works",
          title: { fa: "آثار و قیمت‌ها", en: "Works and prices" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "هر اثر یگانه است و فقط یک نسخه از آن فروخته می‌شود. پرداخت به تومان انجام می‌شود و مبلغ نهایی هر سفارش همان است که هنگام ثبت آن نمایش داده می‌شود.",
                en: "Every work is unique and only one copy is sold. Payment is made in toman, and an order's final amount is the one shown when it is placed.",
              },
            },
            {
              kind: "p",
              text: {
                fa: "رَد تلاش می‌کند توضیحات و تصویرها دقیق باشند. تفاوت اندک رنگ و بافت ناشی از نمایشگر یا ماهیت دست‌ساز اثر، مغایرت محسوب نمی‌شود؛ حق بازگشت آثار آماده در این حالت هم محفوظ است.",
                en: "RAD aims for accurate descriptions and images. Slight differences in colour or texture caused by screens or by the handmade nature of a work are not a mismatch; the right to return ready works still applies.",
              },
            },
          ],
        },
        {
          id: "order",
          title: { fa: "ثبت سفارش و رزرو", en: "Orders and reservations" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "افزودن اثر به سبد، آن را ۱۵ دقیقه برای کاربر رزرو می‌کند. با ثبت سفارش، اثر ۳۰ دقیقه برای پرداخت نگه داشته می‌شود؛ اگر در این مدت رسید پرداخت ارسال نشود، سفارش منقضی و اثر به فروشگاه بازگردانده می‌شود.",
                en: "Adding a work to the bag reserves it for the user for 15 minutes. Placing an order holds it for 30 minutes for payment; if no receipt is sent in that time, the order expires and the work returns to the shop.",
              },
            },
            {
              kind: "p",
              text: {
                fa: "قرارداد فروش با تأیید پرداخت از سوی رَد قطعی می‌شود.",
                en: "The sale becomes final when RAD confirms the payment.",
              },
            },
          ],
        },
        {
          id: "payment",
          title: { fa: "پرداخت", en: "Payment" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "پرداخت فعلاً به‌صورت کارت‌به‌کارت انجام می‌شود. خریدار مبلغ دقیق سفارش را به کارت اعلام‌شده در صفحه‌ی سفارش واریز و تصویر رسید و شماره‌ی پیگیری را ارسال می‌کند. رَد رسید را با واریزی حساب تطبیق می‌دهد و نتیجه را در صفحه‌ی سفارش اعلام می‌کند.",
                en: "Payment is currently made by card-to-card transfer. The buyer transfers the exact order amount to the card shown on the order page and sends the receipt image and tracking number. RAD matches the receipt against the account and reports the result on the order page.",
              },
            },
            {
              kind: "p",
              text: {
                fa: "رسید یا شماره‌ی پیگیری تکراری، یا مبلغ مغایر، پذیرفته نمی‌شود و دلیل آن به خریدار اعلام می‌شود. وجهی که بدون ثبت یا تأیید سفارش واریز شده باشد، پس از احراز به همان کارت مبدأ بازگردانده می‌شود.",
                en: "A reused receipt or tracking number, or a mismatched amount, is not accepted, and the buyer is told why. Money transferred without a placed or confirmed order is returned to the originating card once verified.",
              },
            },
          ],
        },
        {
          id: "delivery",
          title: { fa: "ارسال", en: "Delivery" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "آثار با بسته‌بندی محافظ و بیمه، رایگان به نشانی‌های داخل ایران ارسال می‌شوند. زمان تقریبی رسیدن از تأیید پرداخت، برای تهران ۲ تا ۴ و برای شهرهای دیگر ۴ تا ۸ روز کاری است.",
                en: "Works ship free, insured and protectively packed to addresses in Iran. Estimated delivery from payment confirmation is 2–4 working days for Tehran and 4–8 for other cities.",
              },
            },
          ],
        },
        {
          id: "withdrawal",
          title: { fa: "انصراف و بازگشت", en: "Withdrawal and returns" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "خریدار آثار آماده می‌تواند تا ۴۸ ساعت پس از تحویل، بدون ذکر دلیل، درخواست بازگشت دهد. اثر باید سالم، استفاده‌نشده و همراه بسته‌بندی و شناسنامه بازگردانده شود. هزینه‌ی ارسال برگشت با خریدار است و مبلغ اثر پس از دریافت و بررسی به کارت مبدأ بازگردانده می‌شود.",
                en: "Buyers of ready works may request a return within 48 hours of delivery without giving a reason. The work must come back undamaged, unused, with its packaging and certificate. Return shipping is paid by the buyer, and the price is refunded to the originating card once the work is received and checked.",
              },
            },
            {
              kind: "p",
              text: {
                fa: "سفارش‌های اختصاصی که بر اساس مشخصات شخصی خریدار ساخته می‌شوند، مشمول بازگشت نیستند؛ مگر در صورت آسیب در ارسال یا مغایرت اساسی با پیشنهاد تأییدشده.",
                en: "Custom pieces made to the buyer's personal specification are not returnable, except for transit damage or a substantial departure from the approved proposal.",
              },
            },
          ],
          underReview: RETURN_WINDOW_REVIEW,
        },
        {
          id: "damage",
          title: { fa: "آسیب در ارسال", en: "Transit damage" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "آسیب ناشی از حمل باید ظرف ۲۴ ساعت از تحویل، همراه عکس بسته‌بندی و آسیب، از صفحه‌ی سفارش گزارش شود. در صورت تأیید، اثر به هزینه‌ی رَد مرمت یا مبلغ آن به‌طور کامل بازگردانده می‌شود. گزارشی که دیرتر برسد نیز بررسی می‌شود.",
                en: "Damage caused in transit must be reported from the order page within 24 hours of delivery, with photos of the packaging and the damage. If confirmed, the work is repaired at RAD's cost or its price is refunded in full. Later reports are still reviewed.",
              },
            },
          ],
        },
        {
          id: "custom",
          title: { fa: "سفارش اختصاصی", en: "Custom orders" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "قیمت، زمان، مبلغ بیعانه و جزئیات هر سفارش اختصاصی در پیشنهاد رَد اعلام و با تأیید خریدار و پرداخت بیعانه قطعی می‌شود. شرایط اصلاح طرح، تغییرات و لغو در راهنمای «سفارش اختصاصی» آمده و جزء این شرایط است.",
                en: "The price, timing, deposit and details of each custom order are set out in the RAD proposal and become binding when the buyer approves it and pays the deposit. Revision, change and cancellation terms are in the “Custom orders” guide and form part of these terms.",
              },
            },
          ],
        },
        {
          id: "ip",
          title: { fa: "مالکیت فکری", en: "Intellectual property" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "تصویرها، متن‌ها، طراحی سایت و آثار رَد متعلق به رَد و سازندگان آن است و استفاده‌ی تجاری از آن‌ها بدون اجازه‌ی کتبی مجاز نیست. خرید یک اثر، مالکیت همان نسخه‌ی فیزیکی را منتقل می‌کند، نه حق تکثیر آن را.",
                en: "The images, texts, site design and works of RAD belong to RAD and its makers and may not be used commercially without written permission. Buying a work transfers ownership of that physical piece, not the right to reproduce it.",
              },
            },
            {
              kind: "p",
              text: {
                fa: "کاربر مسئول است تصویر و طرحی که برای سفارش اختصاصی می‌فرستد متعلق به خودش باشد یا اجازه‌ی استفاده از آن را داشته باشد.",
                en: "Users are responsible for owning, or having permission to use, any image or design they send for a custom order.",
              },
            },
          ],
        },
        {
          id: "content",
          title: { fa: "نظرها و محتوای کاربر", en: "Reviews and user content" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "نظرها و تصویرهایی که کاربر منتشر می‌کند نباید توهین‌آمیز، گمراه‌کننده یا ناقض حق دیگران باشد. رَد می‌تواند چنین محتوایی را حذف کند.",
                en: "Reviews and images users publish must not be abusive, misleading or infringe others' rights. RAD may remove such content.",
              },
            },
          ],
        },
        {
          id: "liability",
          title: { fa: "حدود مسئولیت", en: "Liability" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "رَد مسئول آسیبی که پس از تحویل و بر اثر استفاده‌ی نادرست از اثر ایجاد شود نیست. دسترسی به سایت ممکن است گاهی برای نگه‌داری یا به دلایل خارج از اختیار رَد قطع شود؛ اگر در این مدت سفارشی منقضی شد و واریزی انجام شده بود، مبلغ آن بازگردانده می‌شود.",
                en: "RAD is not liable for damage caused after delivery by misuse of a work. The site may occasionally be unavailable for maintenance or reasons beyond RAD's control; if an order expires during such an outage after a transfer was made, the money is returned.",
              },
            },
          ],
        },
        {
          id: "disputes",
          title: { fa: "حل اختلاف", en: "Disputes" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "در صورت بروز اختلاف، ابتدا از راه پیام و گفت‌وگو با رَد پیگیری می‌شود. این شرایط تابع قوانین جمهوری اسلامی ایران، از جمله قانون تجارت الکترونیکی و قانون حمایت از حقوق مصرف‌کنندگان است و خریدار می‌تواند از مراجع قانونی ذی‌صلاح نیز پیگیری کند.",
                en: "Disputes are first worked through by message and conversation with RAD. These terms are governed by the laws of the Islamic Republic of Iran, including the Electronic Commerce Law and the Consumer Protection Law, and buyers may also pursue the competent legal authorities.",
              },
            },
          ],
        },
        {
          id: "changes",
          title: { fa: "تغییر شرایط", en: "Changes to these terms" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "رَد ممکن است این شرایط را به‌روز کند. هر نسخه با تاریخ انتشارش منتشر می‌شود و نسخه‌های قبلی در همین صفحه در دسترس می‌مانند. هر سفارش تابع نسخه‌ای است که خریدار هنگام ثبت آن پذیرفته و این نسخه همراه سفارش ذخیره می‌شود.",
                en: "RAD may update these terms. Each version is published with its date, and earlier versions stay available on this page. Every order is governed by the version the buyer accepted when placing it, which is saved with the order.",
              },
            },
          ],
        },
        {
          id: "contact",
          title: { fa: "تماس", en: "Contact" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "برای هر پرسشی درباره‌ی این شرایط، از صفحه‌ی «حرف بزنیم» یا دایرکت اینستاگرام رَد پیام بدهید.",
                en: "For any question about these terms, message RAD from the “Let's talk” page or on Instagram Direct.",
              },
            },
          ],
        },
      ],
    },
  ],
};
