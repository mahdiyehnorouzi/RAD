import { normalizeText, textFromUnknown, tokens } from "./normalize";
import type { CatalogProduct, Comparable, ScoredComparable } from "./types";

const categoryAliases: Record<string, string[]> = {
  ceramics: [
    "ceramic",
    "ceramics",
    "pottery",
    "سفال",
    "سرامیک",
    "ظروف",
    "گلدان",
    "کوزه",
    "کاسه",
  ],
  sculpture: ["sculpture", "مجسمه", "تندیس"],
  painting: ["painting", "نقاشی", "تابلو"],
  textile: ["textile", "fabric", "پارچه", "بافت"],
  wood: ["wood", "wooden", "چوب", "چوبی"],
  jewelry: ["jewelry", "jewellery", "زیورآلات", "نقره"],
  print: ["print", "linocut", "چاپ", "لینوکات"],
};

function overlap(left: Set<string>, right: Set<string>) {
  const common = [...left].filter((token) => right.has(token)).length;
  return common / Math.max(1, new Set([...left, ...right]).size);
}
function numbers(value: string) {
  return new Set(normalizeText(value).match(/\d+(?:\.\d+)?/g) ?? []);
}

export function scoreComparable(
  product: CatalogProduct,
  comparable: Comparable,
): ScoredComparable {
  const productText = [
    product.name,
    product.subtitle,
    product.story,
    ...textFromUnknown(product.details),
  ].join(" ");
  const comparableText = [
    comparable.name,
    comparable.category,
    ...comparable.features,
  ]
    .filter(Boolean)
    .join(" ");
  const lexical = overlap(tokens(productText), tokens(comparableText));
  const category = (
    categoryAliases[product.category] ?? [product.category]
  ).some((alias) =>
    normalizeText(comparableText).includes(normalizeText(alias)),
  )
    ? 1
    : 0;
  const productNumbers = numbers(productText);
  const dimension =
    productNumbers.size &&
    [...productNumbers].some((number) => numbers(comparableText).has(number))
      ? 1
      : 0;
  const nameOverlap = overlap(tokens(product.name), tokens(comparable.name));
  const score = Math.min(
    1,
    category * 0.35 + lexical * 0.3 + dimension * 0.2 + nameOverlap * 0.15,
  );
  const reasons = [
    category && "category",
    dimension && "dimension",
    lexical > 0 && "features",
    nameOverlap > 0 && "name",
  ].filter(Boolean) as string[];
  return { ...comparable, score: Number(score.toFixed(4)), reasons };
}

export function findComparables(
  product: CatalogProduct,
  candidates: Comparable[],
  limit = 7,
) {
  return candidates
    .map((item) => scoreComparable(product, item))
    .filter((item) => item.score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
