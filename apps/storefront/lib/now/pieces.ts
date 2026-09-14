import type { LiveMilestone, LivePiece } from "@/components/now/type";
import type { LocaleCopy } from "@/types/locale";

function copy(fa: string, en: string): LocaleCopy {
  return { fa, en };
}

function rail(
  current: LivePiece["current"],
  extras: Partial<Record<LivePiece["current"], { media?: string; note?: LocaleCopy }>> = {},
): LiveMilestone[] {
  const order: LivePiece["current"][] = [
    "idea",
    "form",
    "drying",
    "first_kiln",
    "glaze",
    "last_kiln",
    "ready",
  ];
  const titles: Record<LivePiece["current"], LocaleCopy> = {
    idea: copy("ایده رسید", "The idea arrived"),
    form: copy("فرم پیدا شد", "The form was found"),
    drying: copy("خشک شدن", "Drying"),
    first_kiln: copy("کوره اول", "First kiln"),
    glaze: copy("لعاب", "Glaze"),
    last_kiln: copy("کوره آخر", "Last kiln"),
    ready: copy("آماده رفتن", "Ready to leave"),
  };
  const index = order.indexOf(current);
  return order.map((id, item) => ({
    id,
    title: titles[id],
    done: item < index,
    current: item === index,
    media: extras[id]?.media,
    note: extras[id]?.note,
  }));
}

export const livePieces: LivePiece[] = [
  {
    code: "021",
    name: copy("کاسه صبح", "Morning bowl"),
    maker: copy("سحر میرزایی", "Sahar Mirzaei"),
    startedDaysAgo: 4,
    current: "drying",
    image: "/making/RAD-M-1405-17/cleaned.png",
    milestones: rail("drying", {
      idea: { media: "/making/RAD-M-1405-17/forming.png" },
      form: { media: "/making/RAD-M-1405-17/cleaned.png" },
    }),
    notes: [
      {
        at: copy("امروز", "Today"),
        body: copy(
          "حالا باید صبر کند. چهار روز از شروعش گذشته.",
          "Now it has to wait. Four days have passed since it began.",
        ),
        media: "/making/RAD-M-1405-17/cleaned.png",
      },
    ],
  },
  {
    code: "014",
    name: copy("کاسه هاله", "Halo bowl"),
    maker: copy("نیلوفر نادری", "Niloufar Naderi"),
    startedDaysAgo: 11,
    current: "glaze",
    image: "/making/RAD-M-1405-17/glaze-tile.png",
    milestones: rail("glaze", {
      idea: { media: "/making/RAD-M-1405-17/forming.png" },
      form: { media: "/making/RAD-M-1405-17/cleaned.png" },
      first_kiln: {
        media: "/making/RAD-M-1405-17/cleaned.png",
        note: copy(
          "امروز رَد تو برای اولین‌بار رفت توی کوره.",
          "Today your RAD went into the kiln for the first time.",
        ),
      },
      glaze: {
        media: "/making/RAD-M-1405-17/glaze-tile.png",
        note: copy(
          "یه اتفاق افتاد. لعاب این قسمت دقیقاً اون چیزی نشد که فکر می‌کردیم. نگهش داشتیم.",
          "Something happened. The glaze on this part did not become what we thought. We kept it.",
        ),
      },
    }),
    notes: [
      {
        at: copy("دیروز", "Yesterday"),
        body: copy(
          "امروز رَد تو برای اولین‌بار رفت توی کوره.",
          "Today your RAD went into the kiln for the first time.",
        ),
        media: "/making/RAD-M-1405-17/cleaned.png",
      },
      {
        at: copy("امروز", "Today"),
        body: copy(
          "یه اتفاق افتاد. لعاب این قسمت دقیقاً اون چیزی نشد که فکر می‌کردیم. نگهش داشتیم.",
          "Something happened. The glaze on this part did not become what we thought. We kept it.",
        ),
        media: "/making/RAD-M-1405-17/glaze-tile.png",
      },
    ],
  },
];

export function findLivePiece(code: string) {
  const digits = code.replace(/\D/g, "").padStart(3, "0");
  return livePieces.find((item) => item.code === digits);
}

export function workshopToday() {
  return livePieces.find((item) => item.code === "021") ?? livePieces[0];
}
