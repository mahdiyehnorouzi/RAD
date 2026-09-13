"use client";

import { useState } from "react";
import { useLocale } from "@/components/i18n";
import type { WorkMark } from "./type";
import "./work-marks.css";

export function WorkMarks({
  src,
  marks,
}: {
  src: string;
  marks: WorkMark[];
}) {
  const { locale, t } = useLocale();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="work-marks">
      <h2>{t("marksTitle")}</h2>
      <p>{t("marksBody")}</p>
      <div className="work-marks-stage">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" />
        {marks.map((mark, index) => (
          <button
            key={`${mark.x}-${mark.y}`}
            type="button"
            className={open === index ? "is-open" : ""}
            style={{ left: `${mark.x}%`, top: `${mark.y}%` }}
            onClick={() => setOpen(open === index ? null : index)}
            aria-expanded={open === index}
          >
            <span>{locale === "fa" ? "نقطه" : "Mark"}</span>
          </button>
        ))}
      </div>
      {open !== null && marks[open] ? (
        <aside>
          <b>{marks[open].title[locale]}</b>
          <p>{marks[open].note[locale]}</p>
        </aside>
      ) : null}
    </section>
  );
}
