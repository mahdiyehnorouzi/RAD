"use client";
import { ArtworkVisual, ButtonLink, ProductCard } from "@/components/site";
import { useLocale } from "@/components/i18n";
import { useCatalog } from "@/components/catalog-provider";
import { featuredProductSlugs, artworkVisual } from "@/lib/artwork";

export default function Home() {
  const { t, locale } = useLocale();
  const { products } = useCatalog();
  const featured = featuredProductSlugs.flatMap((slug) => {
    const product = products.find((item) => item.slug === slug);
    return product ? [product] : [];
  });
  const hero = featured[1] ?? featured[0] ?? products[0];
  const studio = featured[2] ?? products[1] ?? products[0];
  const steps = [
    [locale === "fa" ? "۰۱/۰۴" : "01/04", t("step1Title"), t("step1Body")],
    [locale === "fa" ? "۰۲/۰۴" : "02/04", t("step2Title"), t("step2Body")],
    [locale === "fa" ? "۰۳/۰۴" : "03/04", t("step3Title"), t("step3Body")],
    [locale === "fa" ? "۰۴/۰۴" : "04/04", t("step4Title"), t("step4Body")],
  ];
  return (
    <>
      <section className="hero section">
        <div className="hero-copy">
          <h1>
            {t("heroTitle1")}
            <br />
            {t("heroTitle2")}
          </h1>
          <p className="hero-thesis">{locale === "fa" ? "یک اثر. یک ردِ دست. یک بار." : "One work. One maker's trace. Made once."}</p>
        </div>
        <div className="hero-art">
          <div className="hero-identifier" aria-hidden="true">
            <span>RĀD / 027</span>
            <span>{locale === "fa" ? "تهران / ۱۴۰۵" : "TEHRAN / 2026"}</span>
          </div>
          <span className="one-badge">
            <b>{locale === "fa" ? "۱ / ۱" : "1 / 1"}</b>
          </span>
          <span className="sun-disc" />
          {hero ? (
            <ArtworkVisual
              visual={artworkVisual(hero)}
              color={hero.color}
              accent={hero.accent}
              shape={hero.shape}
            />
          ) : null}
        </div>
      </section>
      <section className="section evidence-film">
        <div className="film-copy"><span className="eyebrow">{locale === "fa" ? "مدرک ساخت" : "EVIDENCE OF MAKING"}</span><h2>{locale === "fa" ? "دست، ماده، اثر." : "Hand, material, work."}</h2><p>{locale === "fa" ? "چند ثانیه از یکی از مسیرهای واقعی ساخت؛ هر ماده ریتم و ردّ مخصوص خودش را دارد." : "A few seconds from one real making process—every material keeps its own rhythm and trace."}</p></div>
        <figure className="film-frame"><img className="studio-film" src="/studio-process.svg" alt={locale === "fa" ? "ویدیوی کوتاه یکی از مسیرهای ساخت اثر" : "Short loop showing one artwork making process"} /><figcaption>{locale === "fa" ? "تهران / ماده، فرم، پرداخت، امضا" : "TEHRAN / MATERIAL, FORM, FINISH, SIGNATURE"}</figcaption></figure>
      </section>
      <section
        className="entry-paths section"
        aria-label={locale === "fa" ? "دو مسیر رَد" : "Two ways into RAD"}
      >
        <article>
          <span>I — {locale === "fa" ? "انتخاب" : "OWN"}</span>
          <h2>{locale === "fa" ? "یک رَد را انتخاب کنید" : "Own a RAD"}</h2>
          <p>
            {locale === "fa"
              ? "اثری آماده، شماره‌گذاری‌شده و تنها در یک نسخه."
              : "Choose a finished, numbered work that exists only once."}
          </p>
          <ButtonLink href="/products" outline arrow>
            {t("viewWorks")}
          </ButtonLink>
        </article>
        <article>
          <span>II — {locale === "fa" ? "خلق" : "CREATE"}</span>
          <h2>
            {locale === "fa" ? "رَد خودتان را بسازید" : "Create your RAD"}
          </h2>
          <p>
            {locale === "fa"
              ? "از ایده و تصویر اولیه تا بررسی هنرمند و ساخت یک قطعه شخصی."
              : "Move from an idea and first visualization to artist review and a personal piece."}
          </p>
          <ButtonLink href="/studio" outline>
            {t("designMine")}
          </ButtonLink>
        </article>
      </section>
      <section className="section collection archive-section">
        <header className="section-heading">
          <div>
            <span className="eyebrow">{locale === "fa" ? "آرشیو رَد" : "RAD ARCHIVE"}</span>
            <h2>{locale === "fa" ? "آثار موجود و فروخته‌شده" : "Available and collected works"}</h2>
            <p>{locale === "fa" ? "اثر فروخته‌شده از آرشیو حذف نمی‌شود؛ مسیر رَد را کامل می‌کند." : "Collected works remain visible; they complete RAD's story."}</p>
          </div>
          <ButtonLink href="/products" outline>
            {t("allWorks")}
          </ButtonLink>
        </header>
        <div className="product-grid home-products">
          {featured.map((p, i) => (
            <ProductCard product={p} index={i} key={p.slug} />
          ))}
        </div>
      </section>
      <section className="studio-callout section">
        <div className="studio-visual">
          <span className="orbit o1" />
          <span className="orbit o2" />
          {studio ? (
            <ArtworkVisual
              visual={artworkVisual(studio)}
              color={studio.color}
              accent={studio.accent}
              shape={studio.shape}
            />
          ) : null}
        </div>
        <div>
          <span className="eyebrow">{t("studioEyebrow")}</span>
          <h2>{locale === "fa" ? "چیزی را که هنوز وجود ندارد، تصور کن." : "Imagine what does not exist yet."}</h2>
          <p>{locale === "fa" ? "رَد کمک می‌کند آن را ببینی و بسازی." : "RAD helps you see it and make it."}</p>
          <ButtonLink href="/studio" light>
            {t("enterStudio")}
          </ButtonLink>
        </div>
      </section>
      <section id="story" className="section story human-story">
        <span className="big-number">{locale === "fa" ? "۱/۱" : "1/1"}</span>
        <div>
          <span className="eyebrow">{t("philosophy")}</span>
          <h2>{locale === "fa" ? "رَد از میل به ساختن اشیایی شروع شد که برای هیچ‌کس دیگری ساخته نشده‌اند." : "RAD began with the desire to make objects created for no one else."}</h2>
          <p>{locale === "fa" ? "هر اثر در گفت‌وگوی مستقیم میان نگاه هنرمند، ماده و دست شکل می‌گیرد. تفاوت‌ها نقص نیستند؛ امضای فرآیندند." : "Each work takes shape through a direct conversation between the maker's eye, material, and hand. Variations are the process's signature."}</p>
        </div>
      </section>
      <section className="provenance section">
        <header>
          <span className="eyebrow">
            III — {locale === "fa" ? "منشأ اثر" : "PROVENANCE"}
          </span>
          <h2>
            {locale === "fa"
              ? "ارزش یک اثر، در مسیر ساخت آن است."
              : "A work earns its value through how it is made."}
          </h2>
        </header>
        <div className="provenance-grid">
          <article>
            <b>{locale === "fa" ? "ساخت در تهران" : "Made in Tehran"}</b>
            <p>
              {locale === "fa"
                ? "هنرمند، متریال و تمام مراحل ساخت هر اثر در شناسنامه آن ثبت می‌شود."
                : "The maker, material, and every making stage are recorded in the work's provenance."}
            </p>
          </article>
          <article>
            <b>
              {locale === "fa"
                ? "ردِ دست حفظ می‌شود"
                : "The hand remains visible"}
            </b>
            <p>
              {locale === "fa"
                ? "تفاوت‌های طبیعی هر ماده پنهان نمی‌شوند؛ همان‌ها بخشی از هویت اثرند."
                : "Natural variations in every material remain visible as part of the work's identity."}
            </p>
          </article>
          <article>
            <b>
              {locale === "fa" ? "شماره و شناسنامه" : "Numbered provenance"}
            </b>
            <p>
              {locale === "fa"
                ? "هر اثر با شماره، متریال، سال و نشان ۱/۱ ثبت می‌شود."
                : "Each work is recorded with its number, material, year, and 1/1 mark."}
            </p>
          </article>
        </div>
      </section>
      <section className="section process">
        <header className="section-heading">
          <div>
            <span className="eyebrow">{t("processEyebrow")}</span>
            <h2>{t("processTitle")}</h2>
          </div>
        </header>
        <div className="steps">
          {steps.map((x) => (
            <article key={x[0]}>
              <span>{x[0]}</span>
              <h3>{x[1]}</h3>
              <p>{x[2]}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section orders-entry"><div><span className="eyebrow">{locale === "fa" ? "سفارش‌های شما" : "YOUR ORDERS"}</span><h2>{locale === "fa" ? "مسیر ساخت اثرتان را دنبال کنید." : "Follow your work as it is made."}</h2><p>{locale === "fa" ? "از تأیید طرح و انتخاب هنرمند تا ساخت، امضا و ارسال." : "From concept approval and maker selection to production, signature, and delivery."}</p></div><ButtonLink href="/orders" outline>{locale === "fa" ? "دیدن سفارش‌ها" : "View orders"}</ButtonLink></section>
      <section className="section final-cta"><span className="eyebrow">{locale === "fa" ? "قطعه شما" : "YOUR OBJECT"}</span><h2>{locale === "fa" ? "چیزی را شروع کنید که فقط یک بار ساخته می‌شود." : "Start something that will be made only once."}</h2><ButtonLink href="/studio">{t("designMine")}</ButtonLink></section>
    </>
  );
}
