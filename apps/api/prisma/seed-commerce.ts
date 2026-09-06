import { Prisma } from "@prisma/client";
import type { PrismaClient } from "@prisma/client";
import { createSubmittedCommission } from "../src/commissions/commission.factory";
import { loc, newEntityId, type MakingCommission, type MakingStageId, type NextActor } from "../src/commissions/commission.types";

const day = 24 * 60 * 60 * 1000;

const shopOrders: Array<{
  id: string;
  daysAgo: number;
  status: string;
  name: string;
  city: string;
  phone: string;
  address: string;
  slug: string;
  productStatus: "reserved" | "sold" | "available";
}> = [
  {
    id: "RAD-S-1405-01",
    daysAgo: 1,
    status: "received",
    name: "نیلوفر نادری",
    city: "تهران",
    phone: "09121234501",
    address: "خیابان ولیعصر، کوچهٔ صنوبر، پلاک ۱۲",
    slug: "blue-pedestal-tray",
    productStatus: "reserved",
  },
  {
    id: "RAD-S-1405-02",
    daysAgo: 3,
    status: "approved",
    name: "آرمان کریمی",
    city: "اصفهان",
    phone: "09131234502",
    address: "چهارباغ عباسی، پلاک ۴۸",
    slug: "blue-pink-jar",
    productStatus: "reserved",
  },
  {
    id: "RAD-S-1405-03",
    daysAgo: 6,
    status: "forming",
    name: "رها احمدی",
    city: "شیراز",
    phone: "09171234503",
    address: "بلوار چمران، کوچهٔ نارنج",
    slug: "cat-cup",
    productStatus: "reserved",
  },
  {
    id: "RAD-S-1405-04",
    daysAgo: 9,
    status: "drying",
    name: "کیانوش مرادی",
    city: "تبریز",
    phone: "09141234504",
    address: "خیابان ارتش، پلاک ۲۲",
    slug: "contour-jar",
    productStatus: "reserved",
  },
  {
    id: "RAD-S-1405-05",
    daysAgo: 12,
    status: "firing",
    name: "سارا موسوی",
    city: "مشهد",
    phone: "09151234505",
    address: "بلوار سجاد، پلاک ۹۰",
    slug: "dachshund-sculpture",
    productStatus: "reserved",
  },
  {
    id: "RAD-S-1405-06",
    daysAgo: 16,
    status: "glazing",
    name: "بهراد سلطانی",
    city: "رشت",
    phone: "09111234506",
    address: "گیلان، خیابان معلم",
    slug: "olive-loop-vessel",
    productStatus: "reserved",
  },
  {
    id: "RAD-S-1405-07",
    daysAgo: 20,
    status: "quality",
    name: "مهسا فرهادی",
    city: "یزد",
    phone: "09133501207",
    address: "محلهٔ فهادان، پلاک ۷",
    slug: "mint-angular-cup",
    productStatus: "reserved",
  },
  {
    id: "RAD-S-1405-08",
    daysAgo: 24,
    status: "shipped",
    name: "پویا نعمتی",
    city: "کرج",
    phone: "09122601208",
    address: "گوهردشت، فاز ۳",
    slug: "speckled-cup",
    productStatus: "sold",
  },
  {
    id: "RAD-S-1405-09",
    daysAgo: 32,
    status: "delivered",
    name: "مریم کاظمی",
    city: "تهران",
    phone: "09121110909",
    address: "نیاوران، خیابان پریبرز",
    slug: "yellow-graphic-pitcher",
    productStatus: "sold",
  },
];

function msg(
  stageId: MakingStageId,
  author: "customer" | "artist",
  fa: string,
  en: string,
  at: number,
): MakingCommission["messages"][number] {
  return {
    id: newEntityId("m"),
    stageId,
    author,
    body: loc(fa, en),
    createdAt: at,
  };
}

function audit(
  actor: "customer" | "artist" | "system",
  stageId: MakingStageId,
  fa: string,
  en: string,
  at: number,
): MakingCommission["audit"][number] {
  return {
    id: newEntityId("a"),
    at,
    actor,
    stageId,
    action: loc(fa, en),
  };
}

function commission(input: {
  id: string;
  daysAgo: number;
  customerName: string;
  concept: string;
  dimensions: string;
  material: string;
  intendedUse: string;
  category: string;
  stage: MakingStageId;
  nextActor: NextActor;
  kilnLocked?: boolean;
  messages?: MakingCommission["messages"];
  extraAudit?: MakingCommission["audit"];
}): MakingCommission {
  const createdAt = Date.now() - input.daysAgo * day;
  const base = createSubmittedCommission({
    customerName: input.customerName,
    brief: {
      concept: input.concept,
      dimensions: input.dimensions,
      material: input.material,
      intendedUse: input.intendedUse,
      budget: "۱۸ میلیون تومان",
      permission: "material",
      category: input.category,
    },
    title: loc(input.concept.slice(0, 42), input.concept.slice(0, 42)),
  });
  return {
    ...base,
    id: input.id,
    createdAt,
    updatedAt: createdAt + 2 * day,
    estimatedCompletion: createdAt + 42 * day,
    deadlineAt: createdAt + 6 * day,
    stage: input.stage,
    nextActor: input.nextActor,
    kilnLocked: input.kilnLocked ?? false,
    messages: input.messages ?? [],
    audit: [
      audit("customer", "design_submitted", "طرح ارسال شد", "Design submitted", createdAt),
      ...(input.extraAudit ?? []),
    ],
  };
}

export async function seedCommerce(prisma: PrismaClient) {
  const catalog = await prisma.product.findMany({
    where: { slug: { in: shopOrders.map((item) => item.slug) } },
  });
  const bySlug = new Map(catalog.map((item) => [item.slug, item]));

  for (const item of shopOrders) {
    const product = bySlug.get(item.slug);
    if (!product) continue;
    const createdAt = new Date(Date.now() - item.daysAgo * day);
    await prisma.order.upsert({
      where: { id: item.id },
      update: {
        status: item.status,
        name: item.name,
        city: item.city,
        phone: item.phone,
        address: item.address,
        total: product.tomanPrice,
        usdTotal: product.usdPrice,
      },
      create: {
        id: item.id,
        ownerKey: `guest:seed-${item.id}`,
        total: product.tomanPrice,
        usdTotal: product.usdPrice,
        status: item.status,
        name: item.name,
        city: item.city,
        phone: item.phone,
        address: item.address,
        createdAt,
        items: { create: [{ productSlug: item.slug }] },
        payment: {
          create: {
            amount: product.tomanPrice,
            currency: "IRR",
            provider: "sandbox",
            status: "verified",
          },
        },
      },
    });
    const existingItem = await prisma.orderItem.findFirst({
      where: { orderId: item.id, productSlug: item.slug },
    });
    if (!existingItem) {
      await prisma.orderItem.create({ data: { orderId: item.id, productSlug: item.slug } });
    }
    await prisma.product.update({
      where: { slug: item.slug },
      data: { status: item.productStatus },
    });
  }

  const commissions: MakingCommission[] = [
    commission({
      id: "RAD-M-1405-201",
      daysAgo: 1,
      customerName: "آیدا شریفی",
      concept: "کاسه‌ای که حس حیاط مادربزرگ را داشته باشد؛ گرم، کمی نامتقارن.",
      dimensions: "قطر ۲۸ سانتی‌متر",
      material: "استون‌ور",
      intendedUse: "سفرهٔ روزمره",
      category: "ceramics",
      stage: "design_submitted",
      nextActor: "artist",
      messages: [
        msg(
          "design_submitted",
          "customer",
          "می‌خواهم لبه کمی ضخیم‌تر از تصویر باشد تا برای غذای روزانه مناسب شود.",
          "I want a slightly thicker rim so it works for daily meals.",
          Date.now() - day,
        ),
      ],
    }),
    commission({
      id: "RAD-M-1405-202",
      daysAgo: 4,
      customerName: "فرزاد یوسفی",
      concept: "گلدانی از کوچه‌ای فراموش‌شده در تهران، با سایهٔ آجر و گرد.",
      dimensions: "ارتفاع ۴۲ سانتی‌متر",
      material: "خاک رس تهران",
      intendedUse: "دیوار ورودی",
      category: "ceramics",
      stage: "feasibility",
      nextActor: "customer",
      messages: [
        msg(
          "feasibility",
          "artist",
          "ضخامت دیواره برای این ارتفاع باید بیشتر شود؛ در غیر این صورت در پخت ترک می‌خورد.",
          "Wall thickness must increase for this height or it will crack in firing.",
          Date.now() - 2 * day,
        ),
      ],
      extraAudit: [
        audit("artist", "feasibility", "تغییر مشخص درخواست شد", "A specific change was requested", Date.now() - 2 * day),
      ],
    }),
    commission({
      id: "RAD-M-1405-203",
      daysAgo: 8,
      customerName: "لیلا همتی",
      concept: "بشقاب دیواری با نقش زونْد از یک نقشهٔ قدیمی تهران.",
      dimensions: "قطر ۳۶ سانتی‌متر",
      material: "چوب گردو و چاپ",
      intendedUse: "نگاه روی دیوار نشیمن",
      category: "woodwork",
      stage: "approval_deposit",
      nextActor: "customer",
      messages: [
        msg(
          "quote",
          "artist",
          "طرح روی زونْد برش می‌خورد، بعد با دست پرداخت می‌شود. بیعانه ۴۰٪ است.",
          "The drawing is cut on the Zünd, then finished by hand. Deposit is 40%.",
          Date.now() - 3 * day,
        ),
      ],
      extraAudit: [
        audit("artist", "feasibility", "طرح تأیید شد", "Design approved", Date.now() - 5 * day),
        audit("artist", "quote", "پیشنهاد ارسال شد", "Quote sent", Date.now() - 3 * day),
      ],
    }),
    commission({
      id: "RAD-M-1405-204",
      daysAgo: 14,
      customerName: "نوید صالحی",
      concept: "پارچه‌ای با برش زونْد از خط نستعلیق، دوخته‌شده با دست.",
      dimensions: "۹۰ در ۱۴۰ سانتی‌متر",
      material: "کتان خام",
      intendedUse: "آویز دیوار",
      category: "textile",
      stage: "making",
      nextActor: "artist",
      messages: [
        msg(
          "making",
          "artist",
          "نقشه روی زونْد بریده شد. دوخت دستی از فردا شروع می‌شود.",
          "The drawing was cut on the Zünd. Hand stitching starts tomorrow.",
          Date.now() - day,
        ),
      ],
      extraAudit: [
        audit("artist", "feasibility", "طرح تأیید شد", "Design approved", Date.now() - 12 * day),
        audit("customer", "approval_deposit", "بیعانه پرداخت شد", "Deposit paid", Date.now() - 10 * day),
      ],
    }),
    commission({
      id: "RAD-M-1405-205",
      daysAgo: 18,
      customerName: "شیدا رضایی",
      concept: "ظرفی برای نگهداری نور؛ لعاب مات زیتونی.",
      dimensions: "ارتفاع ۲۲ سانتی‌متر",
      material: "استون‌ور",
      intendedUse: "طاقچه",
      category: "ceramics",
      stage: "pre_kiln",
      nextActor: "customer",
      kilnLocked: false,
      messages: [
        msg(
          "pre_kiln",
          "artist",
          "فرم پاک شده و لعاب G-17 پیشنهاد شده. تأیید کوره برگشت‌ناپذیر است.",
          "The form is cleaned and glaze G-17 is proposed. Kiln approval is irreversible.",
          Date.now() - 12 * 60 * 60 * 1000,
        ),
      ],
    }),
    commission({
      id: "RAD-M-1405-206",
      daysAgo: 40,
      customerName: "امیرحسین تقوی",
      concept: "کوزهٔ کوچک با اثر انگشت روی شانه.",
      dimensions: "ارتفاع ۱۶ سانتی‌متر",
      material: "خاک سرخ",
      intendedUse: "قفسهٔ کتاب",
      category: "ceramics",
      stage: "complete",
      nextActor: "none",
      messages: [
        msg(
          "reveal",
          "artist",
          "پخت تمام شد. تفاوت لعاب روی شانه باقی ماند؛ همان امضای اثر است.",
          "Firing is complete. The glaze variation on the shoulder remains; that is the signature.",
          Date.now() - 8 * day,
        ),
      ],
      extraAudit: [
        audit("artist", "shipping", "ارسال شد", "Shipped", Date.now() - 6 * day),
        audit("system", "complete", "تحویل ثبت شد", "Delivery recorded", Date.now() - 2 * day),
      ],
    }),
  ];

  for (const item of commissions) {
    await prisma.commission.upsert({
      where: { id: item.id },
      update: {
        payload: item as unknown as Prisma.InputJsonValue,
      },
      create: {
        id: item.id,
        ownerKey: `guest:seed-${item.id}`,
        payload: item as unknown as Prisma.InputJsonValue,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      },
    });
  }
}
