"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
} from "lucide-react";
import { useLocale } from "@/components/i18n";
import { useOnline } from "@/hooks/use-online";
import { ApiError, isNetworkError, submitArtistApplication } from "@/lib/api";
import { IRAN_CITIES } from "@/lib/geo/iran-cities";
import { ArtworkImages } from "./artwork-images";
import { useCollaborate } from "./hooks";
import {
  ARTWORK_CATEGORY_OPTIONS,
  COLLABORATE_STEPS,
  SHIPPING_METHOD_OPTIONS,
  collaborateCopy,
  optionLabel,
} from "./const";
import styles from "./collaboration.module.css";

export function Collaboration() {
  const { locale, href } = useLocale();
  const c = collaborateCopy[locale];
  const online = useOnline();
  const d = useCollaborate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  const fa = locale === "fa";
  const Back = fa ? ChevronRight : ChevronLeft;
  const Forward = fa ? ArrowLeft : ArrowRight;

  const stepTitle: Record<(typeof COLLABORATE_STEPS)[number], string> = {
    intro: c.introTitle,
    artworks: c.artworksTitle,
    terms: c.termsTitle,
    review: c.reviewTitle,
  };
  const stepHint: Record<(typeof COLLABORATE_STEPS)[number], string> = {
    intro: c.introHelp,
    artworks: c.artworksHelp,
    terms: c.termsHelp,
    review: c.reviewHelp,
  };

  async function submit() {
    if (!d.canSubmit || submitting) return;
    if (!online) {
      setError(c.offline);
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await submitArtistApplication({
        fullName: d.fullName.trim(),
        artistName: d.artistName.trim() || undefined,
        contact: d.contact.trim(),
        city: d.city.trim(),
        instagram: d.instagram.trim() || undefined,
        artworkImages: d.artworkImages,
        about: d.about.trim() || undefined,
        categories: d.categories,
        shippingMethod: d.shippingMethod,
        availability: d.availability || undefined,
      });
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError && err.code === "contact_invalid") {
        d.touch("contact");
        d.goTo("intro");
        setError("");
      } else if (err instanceof ApiError && err.code === "artwork_invalid") {
        d.touch("artworks");
        d.goTo("artworks");
        setError("");
      } else if (isNetworkError(err)) {
        setError(c.offline);
      } else {
        setError(c.submitFailed);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className={styles.collab} dir={fa ? "rtl" : "ltr"}>
        <div className={styles.sent} role="status">
          <span className={styles.tear} aria-hidden="true" />
          <span className={styles.sentStamp} aria-hidden="true">
            <Check size={30} strokeWidth={2.4} />
          </span>
          <p className={styles.sentBrand}>RĀD</p>
          <h1 ref={heading} tabIndex={-1}>
            {c.sentTitle}
          </h1>
          <p>{c.sentBody}</p>
          <Link className={styles.primary} href={href("/")}>
            {c.sentHome}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.collab} dir={fa ? "rtl" : "ltr"}>
      <aside className={styles.sidePanel} aria-hidden="true">
        <figure className={styles.sidePhoto}>
          <Image
            src="/home/collaborate/artist.webp"
            alt=""
            fill
            sizes="(min-width: 980px) 32vw, 0px"
          />
        </figure>
        <p className={styles.sideQuote}>{c.pageTitle}</p>
      </aside>

      <div className={styles.mainColumn}>
        <ol className={styles.steps} aria-label={c.stepsLabel}>
          {COLLABORATE_STEPS.map((stepId, index) => (
            <li
              key={stepId}
              className={styles.stepItem}
              data-current={d.step === stepId}
              data-done={index < d.stepIndex}
            >
              <button
                type="button"
                className={styles.stepButton}
                disabled={index > d.reachedIndex}
                onClick={() => d.goTo(stepId)}
              >
                <span className={styles.stepCircle}>{index + 1}</span>
                <span className={styles.stepLabel}>{stepTitle[stepId]}</span>
              </button>
            </li>
          ))}
        </ol>

        <section className={styles.body} aria-labelledby="collab-title">
          <span className={styles.pinnedTag} aria-hidden="true" />
          <span
            className={`${styles.tear} ${styles.tearTop}`}
            aria-hidden="true"
          />
          <h1 id="collab-title">{stepTitle[d.step]}</h1>
          <p className={styles.hint}>{stepHint[d.step]}</p>

          {d.step === "intro" && (
            <>
              <div className={styles.field}>
                <label htmlFor="collab-full-name">{c.fullNameLabel}</label>
                <input
                  id="collab-full-name"
                  value={d.fullName}
                  maxLength={80}
                  placeholder={c.fullNamePlaceholder}
                  aria-invalid={d.errors.fullName ? true : undefined}
                  onChange={(e) => d.setFullName(e.target.value)}
                  onBlur={() => d.touch("fullName")}
                />
                {d.errors.fullName ? (
                  <p className={styles.fieldError} role="alert">
                    {c.fieldRequired}
                  </p>
                ) : null}
              </div>
              <div className={styles.field}>
                <label htmlFor="collab-artist-name">{c.artistNameLabel}</label>
                <input
                  id="collab-artist-name"
                  value={d.artistName}
                  maxLength={80}
                  placeholder={c.artistNamePlaceholder}
                  onChange={(e) => d.setArtistName(e.target.value)}
                />
              </div>
              <div className={styles.field}>
                <label htmlFor="collab-contact">{c.contactLabel}</label>
                <input
                  id="collab-contact"
                  className="is-ltr"
                  dir="ltr"
                  inputMode="tel"
                  autoComplete="tel"
                  value={d.contact}
                  maxLength={60}
                  placeholder={c.contactPlaceholder}
                  aria-invalid={d.errors.contact ? true : undefined}
                  aria-describedby={
                    d.errors.contact ? "collab-contact-error" : undefined
                  }
                  onChange={(e) => d.setContact(e.target.value)}
                  onBlur={() => d.touch("contact")}
                />
                {d.errors.contact ? (
                  <p
                    id="collab-contact-error"
                    className={styles.fieldError}
                    role="alert"
                  >
                    {d.errors.contact === "empty"
                      ? c.contactEmpty
                      : c.contactInvalid}
                  </p>
                ) : null}
              </div>
              <div className={styles.field}>
                <label htmlFor="collab-city">{c.cityLabel}</label>
                <input
                  id="collab-city"
                  list="collab-city-list"
                  value={d.city}
                  placeholder={c.cityPlaceholder}
                  maxLength={60}
                  aria-invalid={d.errors.city ? true : undefined}
                  onChange={(e) => d.setCity(e.target.value)}
                  onBlur={() => d.touch("city")}
                />
                <datalist id="collab-city-list">
                  {IRAN_CITIES.map((city) => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
                {d.errors.city ? (
                  <p className={styles.fieldError} role="alert">
                    {c.fieldRequired}
                  </p>
                ) : null}
              </div>
              <div className={styles.field}>
                <label htmlFor="collab-instagram">{c.instagramLabel}</label>
                <input
                  id="collab-instagram"
                  className="is-ltr"
                  dir="ltr"
                  value={d.instagram}
                  maxLength={60}
                  placeholder={c.instagramPlaceholder}
                  onChange={(e) => d.setInstagram(e.target.value)}
                />
              </div>
            </>
          )}

          {d.step === "artworks" && (
            <>
              <ArtworkImages
                images={d.artworkImages}
                maxImages={d.maxImages}
                error={d.imageError}
                onError={d.setImageError}
                onAdd={d.addImages}
                onRemove={d.removeImage}
              />
              {d.errors.artworks ? (
                <p className={styles.fieldError} role="alert">
                  {c.artworksRequired}
                </p>
              ) : null}
              <div className={styles.field}>
                <label htmlFor="collab-about">{c.aboutLabel}</label>
                <textarea
                  id="collab-about"
                  value={d.about}
                  maxLength={500}
                  placeholder={c.aboutPlaceholder}
                  onChange={(e) => d.setAbout(e.target.value)}
                />
              </div>
            </>
          )}

          {d.step === "terms" && (
            <>
              <div className={styles.field}>
                <label>{c.categoriesLabel}</label>
                <div className={styles.categories}>
                  {ARTWORK_CATEGORY_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={d.categories.includes(option.id)}
                      onClick={() => {
                        d.toggleCategory(option.id);
                        d.touch("categories");
                      }}
                    >
                      {option.label[locale]}
                    </button>
                  ))}
                </div>
                {d.errors.categories ? (
                  <p className={styles.fieldError} role="alert">
                    {c.categoriesRequired}
                  </p>
                ) : null}
              </div>
              <div className={styles.field}>
                <label>{c.shippingLabel}</label>
                <div className={styles.radios}>
                  {SHIPPING_METHOD_OPTIONS.map((option) => (
                    <label key={option.id}>
                      <input
                        type="radio"
                        name="shipping-method"
                        checked={d.shippingMethod === option.id}
                        onChange={() => {
                          d.setShippingMethod(option.id);
                          d.touch("shippingMethod");
                        }}
                      />
                      <span>{option.label[locale]}</span>
                    </label>
                  ))}
                </div>
                {d.errors.shippingMethod ? (
                  <p className={styles.fieldError} role="alert">
                    {c.shippingRequired}
                  </p>
                ) : null}
              </div>
              <div className={styles.field}>
                <label htmlFor="collab-availability">
                  {c.availabilityLabel}
                </label>
                <select
                  id="collab-availability"
                  value={d.availability}
                  aria-invalid={d.errors.availability ? true : undefined}
                  onChange={(e) => d.setAvailability(e.target.value)}
                  onBlur={() => d.touch("availability")}
                >
                  <option value="">{c.availabilityPlaceholder}</option>
                  <option value="soon">{c.availabilitySoon}</option>
                  <option value="one_month">{c.availabilityOneMonth}</option>
                  <option value="now">{c.availabilityNow}</option>
                </select>
                {d.errors.availability ? (
                  <p className={styles.fieldError} role="alert">
                    {c.availabilityRequired}
                  </p>
                ) : null}
              </div>
            </>
          )}

          {d.step === "review" && (
            <div className={styles.summary}>
              <div className={styles.summarySection}>
                <header>
                  <h2>{c.reviewIntroSection}</h2>
                  <button type="button" onClick={() => d.edit("intro")}>
                    <Pencil size={14} aria-hidden="true" />
                    {c.edit}
                  </button>
                </header>
                <dl>
                  <div>
                    <dt>{c.fullNameLabel}</dt>
                    <dd>{d.fullName || c.fallback}</dd>
                  </div>
                  {d.artistName ? (
                    <div>
                      <dt>{c.artistNameLabel}</dt>
                      <dd>{d.artistName}</dd>
                    </div>
                  ) : null}
                  <div>
                    <dt>{c.contactLabel}</dt>
                    <dd dir="ltr">
                      {d.contactNormalized || d.contact || c.fallback}
                    </dd>
                  </div>
                  <div>
                    <dt>{c.cityLabel}</dt>
                    <dd>{d.city || c.fallback}</dd>
                  </div>
                  {d.instagram ? (
                    <div>
                      <dt>{c.instagramLabel}</dt>
                      <dd dir="ltr">@{d.instagram}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              <div className={styles.summarySection}>
                <header>
                  <h2>{c.reviewArtworksSection}</h2>
                  <button type="button" onClick={() => d.edit("artworks")}>
                    <Pencil size={14} aria-hidden="true" />
                    {c.edit}
                  </button>
                </header>
                <div className={styles.summaryImages}>
                  {d.artworkImages.map((src, index) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={index} src={src} alt="" />
                  ))}
                </div>
                <p>
                  {c.imagesCount.replace(
                    "{count}",
                    String(d.artworkImages.length),
                  )}
                </p>
                {d.about ? <p>{d.about}</p> : null}
              </div>

              <div className={styles.summarySection}>
                <header>
                  <h2>{c.reviewTermsSection}</h2>
                  <button type="button" onClick={() => d.edit("terms")}>
                    <Pencil size={14} aria-hidden="true" />
                    {c.edit}
                  </button>
                </header>
                <dl>
                  <div>
                    <dt>{c.categoriesLabel}</dt>
                    <dd>
                      {d.categories
                        .map((id) =>
                          optionLabel(ARTWORK_CATEGORY_OPTIONS, id, locale),
                        )
                        .join(locale === "fa" ? "، " : ", ") || c.fallback}
                    </dd>
                  </div>
                  <div>
                    <dt>{c.shippingLabel}</dt>
                    <dd>
                      {optionLabel(
                        SHIPPING_METHOD_OPTIONS,
                        d.shippingMethod,
                        locale,
                      ) || c.fallback}
                    </dd>
                  </div>
                  {d.availability ? (
                    <div>
                      <dt>{c.availabilityLabel}</dt>
                      <dd>
                        {
                          {
                            soon: c.availabilitySoon,
                            one_month: c.availabilityOneMonth,
                            now: c.availabilityNow,
                          }[d.availability]
                        }
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </div>

              {error ? (
                <p className={styles.error} role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          )}

          <div className={styles.actions}>
            {d.stepIndex > 0 ? (
              <button type="button" className={styles.ghost} onClick={d.goBack}>
                <Back size={16} aria-hidden="true" />
                {c.back}
              </button>
            ) : null}
            {d.step === "review" ? (
              <button
                type="button"
                className={styles.primary}
                disabled={!d.canSubmit || submitting || !online}
                onClick={submit}
              >
                {submitting ? c.submitting : c.submit}
              </button>
            ) : (
              <button
                type="button"
                className={styles.primary}
                onClick={d.goNext}
              >
                {c.continue}
                <Forward size={16} aria-hidden="true" />
              </button>
            )}
          </div>
          <span
            className={`${styles.tear} ${styles.tearBottom}`}
            aria-hidden="true"
          />
        </section>
      </div>
    </div>
  );
}
