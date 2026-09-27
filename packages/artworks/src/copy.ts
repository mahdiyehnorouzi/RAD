import type { LocalizedText, ProductCategory } from "@rad/types";

export function t(fa: string, en: string): LocalizedText {
  return { fa, en };
}

const careByCategory: Record<ProductCategory, LocalizedText> = {
  ceramics: t(
    "با دست بشویید. از شوک حرارتی و ماشین ظرفشویی دور بماند.",
    "Hand wash. Keep away from thermal shock and the dishwasher.",
  ),
  vases: t(
    "با دست بشویید. از شوک حرارتی و ماشین ظرفشویی دور بماند.",
    "Hand wash. Keep away from thermal shock and the dishwasher.",
  ),
  tableware: t(
    "با دست بشویید. از شوک حرارتی و ماشین ظرفشویی دور بماند.",
    "Hand wash. Keep away from thermal shock and the dishwasher.",
  ),
  sculpture: t(
    "با پارچه نرم و خشک گردگیری کنید. روی سطح صاف و محکم بماند.",
    "Dust with a soft dry cloth. Keep it on a flat, steady surface.",
  ),
  painting: t(
    "دور از آفتاب مستقیم و رطوبت نگه دارید.",
    "Keep away from direct sun and damp.",
  ),
  print: t(
    "دور از آفتاب مستقیم و رطوبت نگه دارید. پشت شیشه قاب شود.",
    "Keep away from direct sun and damp. Frame behind glass.",
  ),
  textile: t(
    "شست‌وشوی سرد و خواباندن صاف. دور از آفتاب مستقیم.",
    "Cold wash and dry flat. Keep out of direct sun.",
  ),
  woodwork: t(
    "با پارچه خشک پاک کنید. گاهی روغن طبیعی بزنید. در آب نماند.",
    "Wipe dry. Re-oil now and then. Never leave it standing in water.",
  ),
  jewelry: t(
    "خشک نگه دارید و با پارچه نرم برق بیندازید.",
    "Keep dry and polish with a soft cloth.",
  ),
};

export function careFor(category: ProductCategory): LocalizedText {
  return careByCategory[category];
}
