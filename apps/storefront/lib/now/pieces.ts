import { formatRadCode, type Artwork } from "@rad/types";
import type {
  LiveJournal,
  LiveMilestone,
  LivePiece,
} from "@/components/now/type";
import { findArtwork } from "@/lib/artworks";
import type { LocaleCopy } from "@/types/locale";

function copy(fa: string, en: string): LocaleCopy {
  return { fa, en };
}

function rail(
  current: LivePiece["current"],
  extras: Partial<
    Record<LivePiece["current"], { media?: string; note?: LocaleCopy }>
  > = {},
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
  const index = order.indexOf(current);
  return order.map((id, item) => ({
    id,
    title: stages[id].title,
    summary: stages[id].summary,
    done: item < index,
    current: item === index,
    media: extras[id]?.media ?? stages[id].media,
    note: extras[id]?.note,
  }));
}

const stages: Record<
  LivePiece["current"],
  { title: LocaleCopy; summary: LocaleCopy; media: string }
> = {
  idea: {
    title: copy("ایده رسید", "The idea arrived"),
    summary: copy(
      "همه‌چیز از یک حس و تصویر شروع می‌شود. طرح اولیه روی کاغذ شکل می‌گیرد.",
      "It starts from a feeling and an image. The first sketch takes shape on paper.",
    ),
    media: "/now/now-idea.jpg",
  },
  form: {
    title: copy("فرم پیدا شد", "The form was found"),
    summary: copy(
      "گل ورز داده می‌شود و فرم روی چرخ شکل می‌گیرد. در این مرحله ابعاد و تناسبات کار مشخص می‌شود.",
      "The clay is wedged and the form rises on the wheel. Its size and proportions are settled here.",
    ),
    media: "/now/now-form.jpg",
  },
  drying: {
    title: copy("خشک شدن", "Drying"),
    summary: copy(
      "کار به آرامی در دمای محیط خشک می‌شود تا برای اولین پخت آماده شود.",
      "The piece dries slowly at room temperature until it is ready for its first firing.",
    ),
    media: "/now/now-drying.jpg",
  },
  first_kiln: {
    title: copy("کوره اول", "First kiln"),
    summary: copy(
      "اولین پخت بدنه را محکم می‌کند و آن را برای لعاب آماده می‌کند.",
      "The first firing hardens the body and readies it for glaze.",
    ),
    media: "/now/now-first-kiln.jpg",
  },
  glaze: {
    title: copy("لعاب", "Glaze"),
    summary: copy(
      "لعاب با دست روی بدنه می‌نشیند. رنگ نهایی تا بعد از کوره معلوم نیست.",
      "Glaze goes on by hand. The final colour stays unknown until after the kiln.",
    ),
    media: "/now/now-glaze.jpg",
  },
  last_kiln: {
    title: copy("کوره آخر", "Last kiln"),
    summary: copy(
      "پخت دوم لعاب را به شیشه تبدیل می‌کند؛ اینجا چیزهایی اتفاق می‌افتد که تکرار نمی‌شوند.",
      "The second firing turns glaze to glass; things happen here that will not happen again.",
    ),
    media: "/now/now-last-kiln.jpg",
  },
  ready: {
    title: copy("آماده رفتن", "Ready to leave"),
    summary: copy(
      "کار از کوره بیرون می‌آید، شماره‌اش را می‌گیرد و آماده‌ی رفتن می‌شود.",
      "The work leaves the kiln, receives its number and is ready to go.",
    ),
    media: "/now/now-ready.jpg",
  },
};

const journals: LiveJournal[] = [
  {
    radNumber: 21,
    startedDaysAgo: 4,
    current: "drying",
    image: "/making/RAD-M-1405-17/cleaned.png",
    milestones: rail("drying"),
    notes: [
      {
        at: copy("امروز", "Today"),
        body: copy(
          "حالا باید صبر کند. چهار روز از شروعش گذشته.",
          "Now it has to wait. Four days have passed since it began.",
        ),
        media: "/now/now-drying.jpg",
      },
    ],
  },
  {
    radNumber: 14,
    startedDaysAgo: 11,
    current: "glaze",
    image: "/making/RAD-M-1405-17/glaze-tile.png",
    milestones: rail("glaze", {
      first_kiln: {
        note: copy(
          "امروز رَد تو برای اولین‌بار رفت توی کوره.",
          "Today your RAD went into the kiln for the first time.",
        ),
      },
      glaze: {
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
        media: "/now/now-first-kiln.jpg",
      },
      {
        at: copy("امروز", "Today"),
        body: copy(
          "یه اتفاق افتاد. لعاب این قسمت دقیقاً اون چیزی نشد که فکر می‌کردیم. نگهش داشتیم.",
          "Something happened. The glaze on this part did not become what we thought. We kept it.",
        ),
        media: "/now/now-glaze.jpg",
      },
    ],
  },
];

/** Journals whose artwork is still being made; a finished work leaves the workshop pages. */
export function livePiecesFrom(artworks: Artwork[]): LivePiece[] {
  return journals.flatMap(({ radNumber, ...journal }) => {
    const artwork = findArtwork(artworks, radNumber);
    if (!artwork || (artwork.status && artwork.status !== "in_workshop"))
      return [];
    return [
      {
        ...journal,
        code: formatRadCode(radNumber),
        slug: artwork.slug,
        status: artwork.status,
        name: artwork.title,
        maker: artwork.artist.name,
      },
    ];
  });
}

export function findLivePiece(pieces: LivePiece[], code: string) {
  const digits = code.replace(/\D/g, "").padStart(3, "0");
  return pieces.find((item) => item.code === digits);
}

export function workshopToday(pieces: LivePiece[]) {
  return pieces.find((item) => item.code === "021") ?? pieces[0];
}
