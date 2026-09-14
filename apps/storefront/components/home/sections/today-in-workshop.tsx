"use client";

import Link from "next/link";
import { useLocale } from "@/components/i18n";
import { formatPassportCode } from "@/lib/passport";
import { workshopToday } from "@/lib/now";
import { useInView } from "../hooks";
import "../motion/reveal.css";
import "./today-in-workshop.css";

export function TodayInWorkshop() {
  const { locale, t, number, href } = useLocale();
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.16 });
  const piece = workshopToday();
  const current = piece.milestones.find((item) => item.current);
  const code = formatPassportCode(piece.code, locale, number);

  return (
    <section
      ref={ref}
      className={`today-workshop home-reveal${inView ? " is-visible" : ""}`}
      aria-labelledby="today-workshop-title"
    >
      <Link href={href(`/now/${piece.code}`)} className="today-workshop-card">
        {piece.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={piece.image} alt="" />
        ) : null}
        <div>
          <span className="eyebrow">{t("todayWorkshop")}</span>
          <h2 id="today-workshop-title">
            {locale === "fa" ? `رَد ${code}` : `RAD ${code}`}
          </h2>
          <p>
            {t("liveNow")}: {current?.title[locale]}
          </p>
          <small>{t("liveDaysAgo", { days: number(piece.startedDaysAgo) })}</small>
        </div>
      </Link>
    </section>
  );
}
