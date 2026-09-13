"use client";

import Image from "next/image";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import "./about-page.css";

const copy = {
  fa: {
    title: "همه‌چیز لازم نیست شبیه نسخه‌ی قبل باشد.",
    openingAlt: "میز کار رَد با ابزار و یک فرم دست‌ساز در نور طبیعی",
    whyTitle: "چرا رَد به‌وجود آمد؟",
    why: [
      "رَد از این فکر شروع شد که چیزهایی که دوستشان داریم، لازم نیست همیشه از قبل طراحی‌شده، دقیق و قابل تکرار باشند.",
      "گاهی یک عکس می‌بینیم و دلمان می‌خواهد نسخه‌ی خودمان از آن را داشته باشیم. گاهی فقط یک فرم، یک رنگ یا یک جزئیات کوچک در ذهنمان می‌ماند.",
      "رَد جایی‌ست برای تبدیل همین چیزها به یک شیء واقعی؛ نه برای کپی‌کردن دقیق یک تصویر، برای دیدن اینکه وقتی یک ایده از ذهن، دست و ماده رد می‌شود، آخرش چه شکلی پیدا می‌کند.",
      "و چون این مسیر هیچ‌وقت دقیقاً دوبار اتفاق نمی‌افتد، هر اثر فقط یک نسخه دارد.",
    ],
    founderTitle: "پشت رَد",
    founderLead: "من مهدیه‌ام.",
    founderBody:
      "رَد از جایی شروع شد که دلم می‌خواست چیزهایی را که توی ذهنم می‌بینم، واقعاً بسازم. این مسیر از سفال شروع شده، اما قرار نیست به سفال محدود بماند؛ هر ماده می‌تواند ردِ متفاوتی از یک ایده نگه دارد.",
    founderVideoLabel: "ویدیوی واقعی از آماده‌کردن گل در یک کارگاه سفال",
    nameTitle: "رَد",
    nameLine: "چیزی که از عبور باقی می‌ماند.",
    nameBody: "اثر دست، ماده، اتفاق و آدمی که آن را ساخته.",
    traceAlt: "نمای نزدیک از سطح و اثر دست روی یک شیء رَد",
    isNot: "رَد نیست:",
    is: "رَد هست:",
    notItems: ["کپی دقیق یک تصویر", "تولید انبوه", "صد نسخه از یک چیز"],
    isItems: [
      "یک ایده",
      "یک مسیر ساخت",
      "یک نتیجه که دقیقاً قابل پیش‌بینی نیست",
      "یک نسخه",
    ],
    finalTitle: "حالا یک رَد پیدا کن.",
    worksTitle: "آثار موجود",
    worksBody: "چیزی را پیدا کن که قبلاً ساخته شده.",
    worksCta: "دیدن آثار",
    customTitle: "رَد خودت",
    customBody: "با یک عکس، ایده یا حتی یک حس شروع کن.",
    customCta: "شروع یک رَد",
  },
  en: {
    title: "Not everything has to resemble the version before it.",
    openingAlt: "RAD's workbench, tools, and a handmade form in natural light",
    whyTitle: "Why does RAD exist?",
    why: [
      "RAD began with the thought that the things we love do not always have to be predetermined, exact, and repeatable.",
      "Sometimes we see a photograph and want a version of our own. Sometimes only a form, a colour, or one small detail stays with us.",
      "RAD is a place for turning those fragments into a real object—not to copy an image exactly, but to discover what an idea becomes after passing through a mind, a hand, and a material.",
      "Because that passage never happens in exactly the same way twice, every work exists only once.",
    ],
    founderTitle: "Behind RAD",
    founderLead: "I’m Mahdiyeh.",
    founderBody:
      "RAD began because I wanted to make the things I could see in my mind real. The path started with clay, but it is not meant to remain only ceramics; every material can hold a different trace of an idea.",
    founderVideoLabel:
      "Live-action footage of hands preparing clay in a pottery workshop",
    nameTitle: "RAD",
    nameLine: "What remains after something passes.",
    nameBody:
      "The trace of a hand, a material, an accident, and the person who made it.",
    traceAlt: "A close view of surface and hand marks on a RAD object",
    isNot: "RAD is not:",
    is: "RAD is:",
    notItems: [
      "an exact copy of an image",
      "mass production",
      "one hundred of the same thing",
    ],
    isItems: [
      "an idea",
      "a making path",
      "a result that cannot be fully predicted",
      "one edition",
    ],
    finalTitle: "Now find a RAD.",
    worksTitle: "Available works",
    worksBody: "Find something that has already been made.",
    worksCta: "See the works",
    customTitle: "Your RAD",
    customBody: "Begin with a photograph, an idea, or even a feeling.",
    customCta: "Start a RAD",
  },
} as const;

export function AboutPage() {
  const { locale } = useLocale();
  const c = copy[locale];

  return (
    <div className="about-page">
      <section className="about-opening section">
        <h1>{c.title}</h1>
        <figure className="about-opening-visual">
          <Image
            src="/about/about-workbench.webp"
            alt={c.openingAlt}
            fill
            priority
            sizes="100vw"
          />
          <figcaption aria-hidden="true">RĀD / 001 · 1 / 1</figcaption>
        </figure>
      </section>

      <section className="about-why section">
        <h2>{c.whyTitle}</h2>
        <div className="about-why-copy">
          {c.why.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="about-founder section">
        <figure>
          <video
            autoPlay
            disablePictureInPicture
            loop
            muted
            playsInline
            poster="/about/about-workbench.webp"
            preload="metadata"
            aria-label={c.founderVideoLabel}
          >
            <source src="/about/about-process-live.mp4" type="video/mp4" />
          </video>
        </figure>
        <div>
          <h2>{c.founderTitle}</h2>
          <p className="about-founder-lead">{c.founderLead}</p>
          <p>{c.founderBody}</p>
          <span className="about-hand-note" aria-hidden="true">
            Tehran · 1405
          </span>
        </div>
      </section>

      <section className="about-name section">
        <div className="about-name-word" aria-hidden="true">
          {c.nameTitle}
        </div>
        <div className="about-name-copy">
          <h2>{c.nameLine}</h2>
          <p>{c.nameBody}</p>
        </div>
        <figure>
          <Image
            src="/catalog/photos/blue-pink-jar.webp"
            alt={c.traceAlt}
            fill
            sizes="(max-width: 760px) 72vw, 30vw"
          />
        </figure>
      </section>

      <section
        className="about-contrast section"
        aria-label={`${c.isNot} ${c.is}`}
      >
        <div className="about-contrast-column is-not">
          <h2>{c.isNot}</h2>
          <ul>
            {c.notItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className="about-contrast-column is-rad">
          <h2>{c.is}</h2>
          <ul>
            {c.isItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <span aria-hidden="true">1 / 1</span>
        </div>
      </section>

      <section className="about-final section">
        <h2>{c.finalTitle}</h2>
        <div className="about-final-paths">
          <article>
            <h3>{c.worksTitle}</h3>
            <p>{c.worksBody}</p>
            <ButtonLink href="/products" outline>
              {c.worksCta}
            </ButtonLink>
          </article>
          <article>
            <h3>{c.customTitle}</h3>
            <p>{c.customBody}</p>
            <ButtonLink href="/studio">{c.customCta}</ButtonLink>
          </article>
        </div>
      </section>
    </div>
  );
}
