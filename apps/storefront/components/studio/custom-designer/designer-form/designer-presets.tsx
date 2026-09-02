"use client";

import { useLocale } from "@/components/i18n";

export function DesignerPresets({
  category,
  presets,
  setPrompt,
}: {
  category: string;
  presets: string[];
  setPrompt: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { t, locale } = useLocale();
  return (
    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2" aria-label={t("suggestedWords")}>
      {presets.map((preset) => (
        <button
          type="button"
          key={preset}
          disabled={!category}
          className="border-0 border-b border-rad-paper/30 bg-transparent py-1 text-rad-paper before:text-rad-clay before:content-['+_']"
          onClick={() =>
            setPrompt(
              (current) =>
                `${current}${current ? (locale === "fa" ? "، " : ", ") : ""}${preset}`,
            )
          }
        >
          {preset}
        </button>
      ))}
    </div>
  );
}

export function DesignerDirection({
  directions,
  direction,
  setDirection,
}: {
  directions: string[];
  direction: number;
  setDirection: (value: number) => void;
}) {
  const { t } = useLocale();
  return (
    <div className="mt-6 border-y border-rad-paper/20" aria-label={t("designDirection")}>
      {directions.map((label, index) => (
        <button
          type="button"
          key={label}
          className={`grid min-h-16 w-full grid-cols-[42px_1fr] items-center border-0 border-b border-rad-paper/20 bg-transparent text-start text-rad-paper ${
            direction === index ? "text-rad-sand" : ""
          }`}
          onClick={() => setDirection(index)}
          aria-pressed={direction === index}
        >
          <small>0{index + 1}</small>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
