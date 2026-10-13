"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, Check, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { useOnline } from "@/hooks/use-online";
import { isNetworkError } from "@/lib/api";
import { submitArtistApplication } from "@/lib/api";
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
import styles from "./collaborate.module.css";

export function Collaborate() {
  const { locale, href } = useLocale();
  const c = collaborateCopy[locale];
  const online = useOnline();
  const d = useCollaborate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

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
      setError(isNetworkError(err) ? c.offline : c.submitFailed);
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className={styles.collab}>
        <div className={styles.sent} role="status">
          <span className={styles.sentMark} aria-hidden="true">
            <Check size={28} />
          </span>
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

  const fa = locale === "fa";
  const Back = fa ? ChevronRight : ChevronLeft;

  return (
    <div className={styles.collab} dir={fa ? "rtl" : "ltr"}>
      <ol className={styles.steps} aria-label={c.stepsLabel}>
        {COLLABORATE_STEPS.map((stepId, index) => (
          <li
            key={stepId}
            data-current={d.step === stepId}
            data-done={index < d.stepIndex}
          >
            <button
              type="button"
              disabled={index > d.reachedIndex}
              onClick={() => d.goTo(stepId)}
            >
              {stepTitle[stepId]}
            </button>
          </li>
        ))}
      </ol>

      <section className={styles.body} aria-labelledby="collab-title">
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
                onChange={(e) => d.setFullName(e.target.value)}
              />
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
                value={d.contact}
                maxLength={60}
                placeholder={c.contactPlaceholder}
                onChange={(e) => d.setContact(e.target.value)}
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="collab-city">{c.cityLabel}</label>
              <input
                id="collab-city"
                list="collab-city-list"
                value={d.city}
                placeholder={c.cityPlaceholder}
                maxLength={60}
                onChange={(e) => d.setCity(e.target.value)}
              />
              <datalist id="collab-city-list">
                {IRAN_CITIES.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
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
                    onClick={() => d.toggleCategory(option.id)}
                  >
                    {option.label[locale]}
                  </button>
                ))}
              </div>
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
                      onChange={() => d.setShippingMethod(option.id)}
                    />
                    <span>{option.label[locale]}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.field}>
              <label htmlFor="collab-availability">{c.availabilityLabel}</label>
              <select
                id="collab-availability"
                value={d.availability}
                onChange={(e) => d.setAvailability(e.target.value)}
              >
                <option value="">{c.availabilityPlaceholder}</option>
                <option value="soon">{c.availabilitySoon}</option>
                <option value="one_month">{c.availabilityOneMonth}</option>
                <option value="now">{c.availabilityNow}</option>
              </select>
            </div>
          </>
        )}

        {d.step === "review" && (
          <div className={styles.summary}>
            <div className={styles.summarySection}>
              <header>
                <h2>{c.reviewIntroSection}</h2>
                <button type="button" onClick={() => d.goTo("intro")}>
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
                  <dd>{d.contact || c.fallback}</dd>
                </div>
                <div>
                  <dt>{c.cityLabel}</dt>
                  <dd>{d.city || c.fallback}</dd>
                </div>
                {d.instagram ? (
                  <div>
                    <dt>{c.instagramLabel}</dt>
                    <dd>@{d.instagram}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className={styles.summarySection}>
              <header>
                <h2>{c.reviewArtworksSection}</h2>
                <button type="button" onClick={() => d.goTo("artworks")}>
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
              <p>{c.imagesCount.replace("{count}", String(d.artworkImages.length))}</p>
              {d.about ? <p>{d.about}</p> : null}
            </div>

            <div className={styles.summarySection}>
              <header>
                <h2>{c.reviewTermsSection}</h2>
                <button type="button" onClick={() => d.goTo("terms")}>
                  <Pencil size={14} aria-hidden="true" />
                  {c.edit}
                </button>
              </header>
              <dl>
                <div>
                  <dt>{c.categoriesLabel}</dt>
                  <dd>
                    {d.categories
                      .map((id) => optionLabel(ARTWORK_CATEGORY_OPTIONS, id, locale))
                      .join(locale === "fa" ? "، " : ", ") || c.fallback}
                  </dd>
                </div>
                <div>
                  <dt>{c.shippingLabel}</dt>
                  <dd>
                    {optionLabel(SHIPPING_METHOD_OPTIONS, d.shippingMethod, locale) ||
                      c.fallback}
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
              disabled={!d.canAdvance}
              onClick={d.goNext}
            >
              {c.continue}
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
