import { artworkFamilies, careFor } from "@rad/artworks";
import {
  formatRadCode,
  parseRadNumber,
  type Artwork,
  type BeforeRadFrame,
  type ProductStatus,
} from "@rad/types";
import type { RadPassport } from "@/components/passport/type";
import { fallbackArtworks } from "@/lib/artworks";
import type { LocaleCopy } from "@/types/locale";

function copy(fa: string, en: string): LocaleCopy {
  return { fa, en };
}

const statusCopy: Record<
  Exclude<ProductStatus, "draft">,
  { owner: LocaleCopy; current: LocaleCopy; note: LocaleCopy }
> = {
  in_workshop: {
    owner: copy("هنوز در دست ساخت", "Still being made"),
    current: copy("تهران → میز کار کارگاه", "Tehran → the workbench"),
    note: copy("دارد ساخته می‌شود", "Being made"),
  },
  ready: {
    owner: copy("هنوز در استودیو", "Still in the studio"),
    current: copy("تهران → قفسه کارگاه", "Tehran → the workshop shelf"),
    note: copy("تمام شده، منتظر عرضه", "Finished, waiting to be released"),
  },
  available: {
    owner: copy("هنوز در استودیو", "Still in the studio"),
    current: copy("تهران → قفسه کارگاه", "Tehran → the workshop shelf"),
    note: copy("منتظر رفتن است", "Waiting to leave"),
  },
  sold: {
    owner: copy("صاحب اول", "The first keeper"),
    current: copy(
      "تهران → خانه‌ی صاحب اول",
      "Tehran → the first keeper's home",
    ),
    note: copy("از اینجا رفت", "It left from here"),
  },
  archived: {
    owner: copy("در آرشیو رَد", "In the RAD archive"),
    current: copy("تهران → آرشیو رَد", "Tehran → the RAD archive"),
    note: copy("در آرشیو ماند", "Kept in the archive"),
  },
};

const workshopStop = (note: LocaleCopy) => ({
  place: copy("کارگاه رَد", "RAD workshop"),
  note,
});

/**
 * A recorded owner keeps the editorial trail. Without one, a sold work gets the
 * generic keeper trail so the passport never contradicts the live status.
 */
function ownership(artwork: Artwork) {
  const byStatus =
    artwork.status && artwork.status !== "draft"
      ? statusCopy[artwork.status]
      : undefined;
  const editorial = artwork.passport?.whereabouts;
  const owner =
    artwork.owner ?? byStatus?.owner ?? copy("استودیو رَد", "RAD Studio");
  if (editorial && (artwork.owner || artwork.status !== "sold"))
    return { owner, whereabouts: editorial };
  return {
    owner,
    whereabouts: {
      current: byStatus?.current ?? copy("تهران", "Tehran"),
      trail: [
        workshopStop(
          byStatus?.note ?? copy("شکل گرفت و پخته شد", "Formed and fired"),
        ),
      ],
    },
  };
}

function persianYear(year: number) {
  return new Intl.NumberFormat("fa-IR", { useGrouping: false }).format(
    year - 621,
  );
}

function photoNote(artwork: Artwork, index: number): LocaleCopy {
  const image = artwork.images[index];
  if (image?.alt && image.enAlt) return copy(image.alt, image.enAlt);
  return index === 0
    ? copy("نمای اول", "First view")
    : copy("نمای دوم", "Second view");
}

function beforeRadFrames(artwork: Artwork): BeforeRadFrame[] {
  if (artwork.passport?.beforeRad?.length) return artwork.passport.beforeRad;
  const stages = artwork.difference?.stageImages;
  const palette = artwork.difference?.palette;
  const first = artwork.images[0]?.src;
  const second = artwork.images[1]?.src ?? first;
  return [
    {
      id: "idea",
      src: stages?.described,
      color: palette?.described.color ?? artwork.accent,
      accent: palette?.described.accent ?? artwork.color,
      caption: artwork.story,
    },
    {
      id: "hand",
      src: stages?.artist ?? first,
      color: palette?.artist.color ?? artwork.color,
      accent: palette?.artist.accent ?? artwork.accent,
      caption:
        artwork.difference?.artistNotes[0] ??
        copy("دست فرم را گذاشت", "The hand set the form"),
    },
    {
      id: "material",
      src: stages?.material ?? second,
      color: palette?.material.color ?? artwork.color,
      accent: palette?.material.accent ?? artwork.accent,
      caption:
        artwork.difference?.materialNotes[0] ??
        copy("ماده مسیر خودش را رفت", "The material took its own path"),
    },
    {
      id: "rad",
      src: first,
      color: artwork.color,
      accent: artwork.accent,
      caption: artwork.title,
    },
  ];
}

/** Still being made: live status says so, or (offline) a work with no price and no passport yet. */
function isUnfinished(artwork: Artwork) {
  return artwork.status
    ? artwork.status === "in_workshop" || artwork.status === "draft"
    : artwork.price === null && !artwork.passport;
}

export function passportFromArtwork(artwork: Artwork): RadPassport | null {
  if (!artwork.radNumber || isUnfinished(artwork)) return null;
  const code = formatRadCode(artwork.radNumber);
  const record = artwork.passport;
  const year = artwork.year ?? new Date().getFullYear();
  return {
    radNumber: artwork.radNumber,
    code,
    slug: artwork.slug,
    status: artwork.status,
    productSlug: artwork.price !== null ? artwork.slug : undefined,
    differenceId: artwork.difference ? artwork.slug : undefined,
    familyId: artworkFamilies.find((family) =>
      family.members.includes(artwork.radNumber!),
    )?.id,
    inspiredBy: record?.inspiredBy
      ? formatRadCode(record.inspiredBy)
      : undefined,
    inspiredNote: record?.inspiredNote,
    traits: record?.traits ?? {
      crooked: 0.35,
      quiet: 0.5,
      worn: 0.4,
      surprise: 0.45,
      strange: 0.35,
    },
    marks: record?.marks,
    transfers: record?.transfers,
    category: artwork.category,
    name: artwork.title,
    maker: artwork.artist.name,
    dateCreated: record?.dateCreated ?? copy(persianYear(year), String(year)),
    clay: artwork.materials.body,
    glaze: artwork.materials.surface ?? artwork.description,
    dimensions: artwork.dimensions ?? copy("ثبت نشده", "Not recorded"),
    firing:
      artwork.materials.process ??
      copy("پخت استودیو رَد، تهران", "RAD studio firing, Tehran"),
    inspiration: artwork.story,
    firstSketch: record?.firstSketch,
    construction:
      record?.construction ??
      (artwork.images[0]?.src
        ? [
            {
              src: artwork.images[0].src,
              note: copy("در کارگاه", "In the workshop"),
            },
          ]
        : []),
    unexpectedChanges:
      record?.unexpectedChanges ??
      copy(
        "اختلاف‌های کوچک سطح و لبه همان‌طور که از آتش درآمدند باقی ماندند.",
        "Small shifts in surface and rim were left as they came from the fire.",
      ),
    finalPhotos: artwork.images
      .slice(0, 2)
      .flatMap((image, index) =>
        image.src ? [{ src: image.src, note: photoNote(artwork, index) }] : [],
      ),
    ...ownership(artwork),
    city: record?.city ?? copy("تهران", "Tehran"),
    care: artwork.care ?? careFor(artwork.category),
    beforeRad: beforeRadFrames(artwork),
  };
}

export function passportsFrom(artworks: Artwork[]): RadPassport[] {
  return artworks
    .map(passportFromArtwork)
    .filter((item): item is RadPassport => Boolean(item))
    .sort((a, b) => a.radNumber - b.radNumber);
}

/** Registry passports for static params and metadata; client views read live artworks. */
export const radPassports: RadPassport[] = passportsFrom(fallbackArtworks);

export function findPassport(
  passports: RadPassport[],
  key: string | number | null | undefined,
) {
  const raw = decodeURIComponent(String(key ?? "")).trim();
  if (!raw) return undefined;
  const bySlug = passports.find((item) => item.slug === raw);
  if (bySlug) return bySlug;
  if (!/^(rad[\s/-]*)?\d+$/i.test(raw)) return undefined;
  const radNumber = parseRadNumber(raw);
  return passports.find((item) => item.radNumber === radNumber);
}

export function passportForProduct(
  passports: RadPassport[],
  product: { slug: string; radNumber?: number },
) {
  return (
    passports.find((item) => item.slug === product.slug) ??
    findPassport(passports, product.radNumber)
  );
}

export function formatPassportName(
  passport: Pick<RadPassport, "code" | "name">,
  locale: "fa" | "en",
  number: (value: number) => string,
) {
  const digits = formatPassportCode(passport.code, locale, number);
  const title = passport.name[locale];
  return locale === "fa"
    ? `رَد ${digits} — ${title}`
    : `RAD ${digits} — ${title}`;
}

/** The year in the work's recorded making date, in that locale's digits. */
export function passportYear(
  passport: Pick<RadPassport, "dateCreated">,
  locale: "fa" | "en",
) {
  return passport.dateCreated[locale].match(/[0-9۰-۹]{4}/)?.[0];
}

export function formatPassportCode(
  code: string,
  locale: "fa" | "en",
  number: (value: number) => string,
) {
  return number(Number(code)).padStart(3, locale === "fa" ? "۰" : "0");
}
