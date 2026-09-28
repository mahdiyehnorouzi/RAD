import type { PolicyDocument } from "../type";

export const PRIVACY_POLICY: PolicyDocument = {
  slug: "privacy",
  kind: "legal",
  icon: "lock",
  title: { fa: "حریم خصوصی", en: "Privacy" },
  summary: {
    fa: "چه اطلاعاتی از تو داریم، چرا، و چه کسی آن را می‌بیند.",
    en: "What we know about you, why, and who sees it.",
  },
  versions: [
    {
      id: "2026-09-27",
      change: { fa: "نخستین نسخه‌ی منتشرشده.", en: "First published version." },
      points: [
        {
          id: "sell",
          label: { fa: "فروش اطلاعات", en: "Selling your data" },
          value: { fa: "هرگز", en: "Never" },
        },
        {
          id: "card",
          label: { fa: "اطلاعات کارت", en: "Card details" },
          value: {
            fa: "شماره‌ی کامل کارت یا رمز آن را نمی‌خواهیم",
            en: "We never ask for your full card number or PIN",
          },
        },
        {
          id: "courier",
          label: { fa: "پست یا پیک", en: "Couriers" },
          value: {
            fa: "فقط نام، نشانی و شماره‌ی تماس",
            en: "Only your name, address and phone",
          },
        },
      ],
      sections: [
        {
          id: "scope",
          title: { fa: "دامنه", en: "Scope" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "این متن توضیح می‌دهد رَد چه اطلاعاتی از کاربران وب‌سایت جمع می‌کند، برای چه کاری از آن استفاده می‌کند و چه کسی به آن دسترسی دارد.",
                en: "This text explains what information RAD collects from website users, what it is used for, and who can access it.",
              },
            },
          ],
        },
        {
          id: "collect",
          title: { fa: "اطلاعاتی که جمع می‌کنیم", en: "What we collect" },
          blocks: [
            {
              kind: "list",
              items: [
                {
                  fa: "حساب کاربری: نام، ایمیل و رمز عبور (به‌صورت هش‌شده).",
                  en: "Account: name, email and password (stored hashed).",
                },
                {
                  fa: "سفارش: نام، شماره‌ی تماس، شهر، نشانی و کد پستی.",
                  en: "Orders: name, phone, city, address and postcode.",
                },
                {
                  fa: "پرداخت: تصویر رسید و شماره‌ی پیگیری واریز. شماره‌ی کامل کارت یا رمز آن را از شما نمی‌خواهیم.",
                  en: "Payment: the receipt image and transfer tracking number. We never ask for your full card number or PIN.",
                },
                {
                  fa: "سفارش اختصاصی: متن، تصویر، طرح و صدایی که برای شرح ایده‌تان می‌فرستید.",
                  en: "Custom orders: the text, images, sketches and voice notes you send to describe your idea.",
                },
                {
                  fa: "پیام‌ها و گزارش‌ها: پیام‌های فرم تماس و گزارش‌های آسیب، همراه عکس‌هایشان.",
                  en: "Messages and reports: contact-form messages and damage reports, with their photos.",
                },
                {
                  fa: "سابقه‌ی پذیرش قوانین: نسخه‌ی قوانینی که هنگام ثبت سفارش پذیرفته‌اید و زمان آن.",
                  en: "Policy acceptance: which version of these rules you accepted when ordering, and when.",
                },
                {
                  fa: "اطلاعات فنی: کوکی نشست برای نگه‌داری سبد و ورود، زبان انتخابی در مرورگر خودتان، و در صورت فعال بودن، آمار کلی بازدید از Google Analytics.",
                  en: "Technical: a session cookie for your bag and sign-in, your language choice in your own browser, and, when enabled, aggregate visit statistics from Google Analytics.",
                },
              ],
            },
          ],
        },
        {
          id: "use",
          title: { fa: "برای چه استفاده می‌شود", en: "What it is used for" },
          blocks: [
            {
              kind: "list",
              items: [
                {
                  fa: "پردازش، ارسال و پیگیری سفارش.",
                  en: "Processing, shipping and tracking orders.",
                },
                {
                  fa: "تطبیق رسید با واریزی حساب و جلوگیری از استفاده‌ی دوباره از یک رسید.",
                  en: "Matching receipts to transfers and stopping one receipt being used twice.",
                },
                {
                  fa: "ساخت سفارش اختصاصی و گفت‌وگو درباره‌ی آن.",
                  en: "Making custom pieces and talking them through with you.",
                },
                {
                  fa: "پاسخ به پیام‌ها و بررسی گزارش‌های آسیب.",
                  en: "Answering messages and reviewing damage reports.",
                },
                {
                  fa: "بهتر کردن سایت با آمار کلی بازدید.",
                  en: "Improving the site with aggregate visit statistics.",
                },
              ],
            },
            {
              kind: "note",
              text: {
                fa: "اطلاعات شما را نمی‌فروشیم و برای تبلیغات در اختیار دیگران نمی‌گذاریم.",
                en: "We don't sell your information or share it with others for advertising.",
              },
            },
          ],
        },
        {
          id: "access",
          title: { fa: "چه کسانی دسترسی دارند", en: "Who can see it" },
          blocks: [
            {
              kind: "list",
              items: [
                {
                  fa: "اعضای تیم رَد که سفارش‌ها، پیام‌ها و پرداخت‌ها را بررسی می‌کنند، هر کدام به اندازه‌ی نقششان.",
                  en: "RAD team members who handle orders, messages and payments, each only as far as their role requires.",
                },
                {
                  fa: "سازنده‌ی اثر در سفارش اختصاصی، برای دیدن ایده و مرجع‌ها.",
                  en: "The maker of a custom piece, to see your idea and references.",
                },
                {
                  fa: "پست یا پیک، فقط نام، نشانی و شماره‌ی تماس برای تحویل.",
                  en: "The carrier, only your name, address and phone for delivery.",
                },
                {
                  fa: "Google Analytics، اگر فعال باشد، فقط برای آمار کلی بازدید.",
                  en: "Google Analytics, when enabled, only for aggregate visit statistics.",
                },
                {
                  fa: "مراجع قانونی، فقط در صورت درخواست قانونی.",
                  en: "Legal authorities, only when lawfully required.",
                },
              ],
            },
          ],
        },
        {
          id: "retention",
          title: { fa: "مدت نگه‌داری", en: "How long we keep it" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "اطلاعات سفارش و پرداخت تا زمانی نگه داشته می‌شود که برای پیگیری، بازگشت، حل اختلاف و تکالیف قانونی لازم است. پیام‌ها و گزارش‌ها تا پایان رسیدگی و پس از آن به‌عنوان سابقه نگه‌داری می‌شوند.",
                en: "Order and payment information is kept as long as needed for follow-up, returns, disputes and legal obligations. Messages and reports are kept until resolved and afterwards as a record.",
              },
            },
          ],
        },
        {
          id: "security",
          title: { fa: "امنیت", en: "Security" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "ارتباط با سایت رمزنگاری‌شده است و رمز عبور به‌صورت هش‌شده ذخیره می‌شود. دسترسی تیم به پنل مدیریت با نقش و سطح دسترسی محدود شده است.",
                en: "Connections to the site are encrypted and passwords are stored hashed. Team access to the admin panel is limited by role.",
              },
            },
          ],
        },
        {
          id: "rights",
          title: { fa: "حق‌های شما", en: "Your rights" },
          blocks: [
            {
              kind: "list",
              items: [
                {
                  fa: "دیدن و اصلاح اطلاعات حساب از صفحه‌ی حساب کاربری.",
                  en: "Seeing and correcting your account details on your account page.",
                },
                {
                  fa: "پرسیدن اینکه چه اطلاعاتی از شما داریم.",
                  en: "Asking what information we hold about you.",
                },
                {
                  fa: "درخواست حذف حساب و اطلاعات، به‌جز آنچه نگه‌داری‌اش قانوناً لازم است.",
                  en: "Asking us to delete your account and data, except what the law requires us to keep.",
                },
              ],
            },
            {
              kind: "p",
              text: {
                fa: "برای این درخواست‌ها از صفحه‌ی «حرف بزنیم» پیام بدهید.",
                en: "Send these requests from the “Let's talk” page.",
              },
            },
          ],
        },
        {
          id: "cookies",
          title: { fa: "کوکی‌ها", en: "Cookies" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "کوکی نشست رَد برای نگه‌داری سبد خرید، ورود و سفارش‌های مهمان لازم است و بدون آن خرید ممکن نیست. زبان انتخابی شما فقط در حافظه‌ی مرورگر خودتان ذخیره می‌شود.",
                en: "RAD's session cookie keeps your bag, sign-in and guest orders; buying isn't possible without it. Your language choice is stored only in your own browser.",
              },
            },
          ],
        },
        {
          id: "changes",
          title: { fa: "تغییر این متن", en: "Changes to this text" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "هر به‌روزرسانی با تاریخ انتشارش منتشر می‌شود و نسخه‌های قبلی در همین صفحه در دسترس می‌مانند.",
                en: "Every update is published with its date, and earlier versions stay available on this page.",
              },
            },
          ],
        },
      ],
    },
  ],
};
