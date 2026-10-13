"use client";

import Image from "next/image";
import { Megaphone, Gem, UserRound } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { useInView } from "../../hooks";
import styles from "./collaborate-band.module.css";

const copy = {
  fa: {
    eyebrow: "همکاری با رد",
    title: "با دست‌هات چیزی می‌سازی؟",
    body: "اگه آثارت با حال‌وهوای رَد جور درمیاد، شاید جاش اینجا باشه.",
    cta: "آشنایی با همکاری",
    benefits: [
      { icon: UserRound, label: "نام سازنده حفظ می‌شود" },
      { icon: Gem, label: "آثار انتخابی و محدود" },
      { icon: Megaphone, label: "معرفی و فروش در رد" },
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

export function CollaborateBand() {
  const { locale } = useLocale();
  const c = copy[locale];
  const { ref, inView } = useInView<HTMLElement>({ threshold: 0.1 });

  return (
    <section
      ref={ref}
      className={styles.collabBand}
      data-visible={inView || undefined}
      aria-labelledby="collab-band-title"
    >
      <figure className={styles.collabPhoto}>
        <Image
          src="/difference/homesickness-bowl/artist-v2.webp"
          alt=""
          fill
          sizes="(min-width: 900px) 42vw, 100vw"
        />
      </figure>
      <div className={styles.collabText}>
        <span className={styles.collabEyebrow}>{c.eyebrow}</span>
        <h2 id="collab-band-title">{c.title}</h2>
        <p>{c.body}</p>
        <ButtonLink href="/studio/collaborate" className={styles.collabCta}>
          {c.cta}
        </ButtonLink>
        <ul className={styles.collabBenefits}>
          {c.benefits.map(({ icon: Icon, label }) => (
            <li key={label}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
