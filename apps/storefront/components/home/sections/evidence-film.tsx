"use client";
import { useLocale } from "@/components/i18n";
import "./evidence-film.css";

export function EvidenceFilm() {
  const { locale } = useLocale();
  return (
    <section className="section evidence-film">
      <div className="film-copy">
        <span className="eyebrow">{locale === "fa" ? "مدرک ساخت" : "EVIDENCE OF MAKING"}</span>
        <h2>{locale === "fa" ? "دست، ماده، اثر." : "Hand, material, work."}</h2>
        <p>
          {locale === "fa"
            ? "چند ثانیه از یکی از مسیرهای واقعی ساخت؛ هر ماده ریتم و ردّ مخصوص خودش را دارد."
            : "A few seconds from one real making process—every material keeps its own rhythm and trace."}
        </p>
      </div>
      <figure className="film-frame">
        {/* 4s landscape wheel-throwing loop — Pexels 9736665 */}
        <video
          className="studio-film"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          onCanPlay={(event) => {
            void event.currentTarget.play();
          }}
          aria-label={
            locale === "fa"
              ? "ویدیوی کوتاه یکی از مسیرهای ساخت اثر"
              : "Short loop showing one artwork making process"
          }
        >
          <source src="/studio-process.mp4" type="video/mp4" />
        </video>
        <figcaption>
          {locale === "fa" ? "تهران / ماده، فرم، پرداخت، امضا" : "TEHRAN / MATERIAL, FORM, FINISH, SIGNATURE"}
        </figcaption>
      </figure>
    </section>
  );
}
