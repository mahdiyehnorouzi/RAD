import type { PolicyDocument } from "../type";

export const SHIPPING_POLICY: PolicyDocument = {
  slug: "shipping",
  kind: "guide",
  icon: "truck",
  title: { fa: "ارسال و تحویل", en: "Shipping and delivery" },
  summary: {
    fa: "زمان، هزینه و بسته‌بندی ارسال.",
    en: "Delivery times, cost and packaging.",
  },
  versions: [
    {
      id: "2026-09-27",
      change: { fa: "نخستین نسخه‌ی منتشرشده.", en: "First published version." },
      points: [
        {
          id: "cost",
          icon: "shield",
          label: { fa: "هزینه‌ی ارسال", en: "Shipping cost" },
          value: { fa: "رایگان و بیمه‌شده", en: "Free and insured" },
        },
        {
          id: "tehran",
          icon: "pin",
          label: { fa: "تهران", en: "Tehran" },
          value: { fa: "۲ تا ۴ روز کاری", en: "2–4 working days" },
        },
        {
          id: "cities",
          icon: "map",
          label: { fa: "شهرهای دیگر", en: "Other cities" },
          value: { fa: "۴ تا ۸ روز کاری", en: "4–8 working days" },
        },
        {
          id: "tracking",
          icon: "route",
          label: { fa: "پیگیری", en: "Tracking" },
          value: {
            fa: "کد رهگیری در صفحه‌ی سفارش",
            en: "Tracking code on your order page",
          },
        },
      ],
      sections: [
        {
          id: "cost",
          title: { fa: "هزینه", en: "Cost" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "ارسال همه‌ی آثار به سراسر ایران رایگان و بیمه‌شده است. مبلغی که در سبد می‌بینی مبلغ نهایی است؛ هزینه‌ی بسته‌بندی یا ارسال جداگانه‌ای اضافه نمی‌شود.",
                en: "Every work ships free and insured anywhere in Iran. The amount in your bag is the final amount; no separate packing or shipping fee is added.",
              },
            },
          ],
        },
        {
          id: "time",
          title: { fa: "زمان رسیدن", en: "Delivery time" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "زمان‌ها از تأیید پرداخت حساب می‌شوند:",
                en: "Times are counted from payment confirmation:",
              },
            },
            {
              kind: "list",
              items: [
                {
                  fa: "تهران: ۲ تا ۴ روز کاری",
                  en: "Tehran: 2–4 working days",
                },
                {
                  fa: "شهرهای دیگر: ۴ تا ۸ روز کاری",
                  en: "Other cities: 4–8 working days",
                },
              ],
            },
            {
              kind: "note",
              text: {
                fa: "روزهای تعطیل رسمی جزو روز کاری نیستند. بعد از تأیید سفارش، تاریخ تقریبی رسیدن را در صفحه‌ی سفارش می‌بینی.",
                en: "Public holidays are not working days. Once your order is confirmed, its estimated delivery date appears on your order page.",
              },
            },
          ],
        },
        {
          id: "packaging",
          title: { fa: "بسته‌بندی", en: "Packaging" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "هر اثر در جعبه‌ی دولایه، با محافظ متناسب با فرمش و شناسنامه‌ی امضاشده ارسال می‌شود.",
                en: "Every work travels in a double box, with protection shaped to its form and a signed certificate.",
              },
            },
          ],
        },
        {
          id: "tracking",
          title: { fa: "پیگیری مرسوله", en: "Tracking" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "وقتی اثر به پست تحویل داده شد، کد رهگیری در صفحه‌ی سفارش قرار می‌گیرد.",
                en: "Once the work is handed to the carrier, its tracking code appears on your order page.",
              },
            },
          ],
        },
        {
          id: "receiving",
          title: { fa: "هنگام تحویل", en: "When it arrives" },
          blocks: [
            {
              kind: "steps",
              items: [
                {
                  fa: "اگر جعبه ظاهراً آسیب دیده، پیش از باز کردن از آن عکس بگیر.",
                  en: "If the box looks damaged, photograph it before opening.",
                },
                {
                  fa: "بسته را با دقت باز کن و اثر را بررسی کن.",
                  en: "Open the box carefully and check the work.",
                },
                {
                  fa: "اگر آسیبی دیدی، تا ۲۴ ساعت بعد از تحویل از صفحه‌ی سفارش گزارش آسیب بفرست.",
                  en: "If you find damage, send a damage report from your order page within 24 hours of delivery.",
                },
              ],
            },
          ],
        },
        {
          id: "address",
          title: { fa: "نشانی و شماره‌ی تماس", en: "Address and phone" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "نشانی، کد پستی و شماره‌ی تماس را دقیق بنویس. اگر بعد از ثبت سفارش نشانی عوض شد، پیش از ارسال به ما پیام بده تا اصلاحش کنیم.",
                en: "Enter your address, postcode and phone accurately. If your address changes after ordering, message us before it ships so we can correct it.",
              },
            },
          ],
        },
        {
          id: "abroad",
          title: { fa: "ارسال به خارج از ایران", en: "Outside Iran" },
          blocks: [
            {
              kind: "p",
              text: {
                fa: "ارسال رایگان فقط برای نشانی‌های داخل ایران است. برای ارسال به خارج از ایران، پیش از خرید با ما هماهنگ کن.",
                en: "Free shipping covers addresses in Iran. To ship abroad, talk to us before buying.",
              },
            },
          ],
        },
      ],
    },
  ],
};
