"use client";

import Image from "next/image";
import Link from "next/link";
import { Megaphone, Gem, UserRound } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { useInView } from "../../hooks";
import styles from "./collaboration-band.module.css";

const copy = {
  fa: {
    eyebrow: "همکاری با رَد",
    title: "با دست‌هات چیزی می‌سازی؟",
    body: "اگه آثارت با حال‌وهوای رَد جور درمیاد، شاید جاش اینجا باشه.",
    cta: "آشنایی با همکاری",
    benefits: [
      { icon: UserRound, label: "نام سازنده حفظ می‌شه" },
      { icon: Gem, label: "آثار انتخابی و محدود" },
      { icon: Megaphone, label: "معرفی و فروش در رَد" },
    ],
  },
  en: {
    eyebrow: "Collaborate with RAD",
    title: "Do you make things with your hands?",
    body: "If your work fits RAD’s mood, there might be a place for it here.",
    cta: "Learn about collaborating",
    benefits: [
      { icon: UserRound, label: "Your name stays yours" },
      { icon: Gem, label: "A curated, limited selection" },
      { icon: Megaphone, label: "Introduced and sold through RAD" },
    ],
  },
} as const;

export function CollaborationBand() {
  const { locale, href } = useLocale();
  const c = copy[locale];
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.1 });

  return (
    <section
      ref={ref}
      className={styles.band}
      data-visible={inView || undefined}
      aria-labelledby="collaboration-band-title"
    >
      <span className={`${styles.tear} ${styles.tearTop}`} aria-hidden="true" />

      <figure className={styles.photo}>
        <Image
          src="/home/collaborate/artist.webp"
          alt=""
          fill
          sizes="(min-width: 900px) 46vw, 100vw"
        />
      </figure>

      <svg
        className={styles.curve}
        viewBox="0 0 200 200"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M4 4C40 40 10 90 60 120S150 150 196 196" />
      </svg>

      <div className={styles.text} dir={locale === "fa" ? "rtl" : "ltr"}>
        <span className={styles.eyebrow}>{c.eyebrow}</span>
        <h2 id="collaboration-band-title">{c.title}</h2>
        <p>{c.body}</p>
        <Link className={styles.cta} href={href("/collaboration")}>
          {c.cta}
        </Link>
      </div>

      <ul className={styles.benefits} dir={locale === "fa" ? "rtl" : "ltr"}>
        {c.benefits.map(({ icon: Icon, label }) => (
          <li key={label}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </li>
        ))}
      </ul>

      <span
        className={`${styles.tear} ${styles.tearBottom}`}
        aria-hidden="true"
      />
    </section>
  );
}
