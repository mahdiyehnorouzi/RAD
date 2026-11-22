"use client";

import { useState } from "react";
import { useLocale } from "@/components/i18n";
import type { MakingCommission } from "@/components/making/type";
import {
  colorSwatches,
  permissionView,
  safeAttachmentSrc,
} from "../brief-display";

function BriefImage({ src, alt }: { src: string; alt: string }) {
  const { locale } = useLocale();
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const fa = locale === "fa";
  return (
    <li>
      {phase === "error" ? (
        <p className="making-file-error">
          {fa ? "این تصویر باز نشد." : "This image could not be opened."}
        </p>
      ) : (
        <img
          src={src}
          alt={alt}
          data-loading={phase === "loading" || undefined}
          onLoad={() => setPhase("ready")}
          onError={() => setPhase("error")}
        />
      )}
      <a href={src} download>
        {fa ? "دانلود تصویر" : "Download image"}
      </a>
    </li>
  );
}

export function CustomerBrief({
  commission,
}: {
  commission: MakingCommission;
}) {
  const { locale, t } = useLocale();
  const fa = locale === "fa";
  const images = [
    ...(commission.brief.images ?? []),
    ...(commission.brief.image &&
    !(commission.brief.images ?? []).includes(commission.brief.image)
      ? [commission.brief.image]
      : []),
  ]
    .map((src) => safeAttachmentSrc(src))
    .filter((src): src is string => Boolean(src));
  const voice = safeAttachmentSrc(commission.brief.voice);
  const voiceMissing = Boolean(commission.brief.voice) && !voice;
  const swatches = colorSwatches(commission.brief.colors, locale);
  const permission = permissionView(commission.brief.permission, locale);
  const rows: Array<{ label: string; value: string }> = [
    {
      label: fa ? "چه چیزی می‌خواهید" : "What you want",
      value: commission.brief.concept,
    },
    {
      label: fa ? "اندازه" : "Size",
      value: commission.brief.dimensions,
    },
    {
      label: fa ? "جنس" : "Material",
      value: commission.brief.material,
    },
    {
      label: fa ? "کاربرد" : "How you will use it",
      value: commission.brief.intendedUse,
    },
    {
      label: fa ? "بودجه" : "Budget",
      value: commission.brief.budget,
    },
    {
      label: fa ? "حس کار" : "Mood",
      value: commission.brief.feeling ?? "",
    },
    {
      label: fa ? "آزادی سازنده" : "How free the maker is",
      value:
        typeof commission.brief.freedom === "number"
          ? `${commission.brief.freedom}%`
          : "",
    },
  ].filter((row) => Boolean(row.value.trim()));
  const [audioError, setAudioError] = useState(false);
  const hasBody =
    rows.length > 0 ||
    swatches.length > 0 ||
    permission.state !== "missing" ||
    images.length > 0 ||
    Boolean(voice) ||
    voiceMissing;
  if (!hasBody) return null;

  return (
    <section
      className="making-brief-block"
      aria-labelledby="making-brief-title"
    >
      <h2 id="making-brief-title">
        {fa ? "آنچه برای ساخت فرستادید" : "What you sent to be made"}
      </h2>
      {rows.length ? (
        <dl className="making-brief">
          {rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
          {swatches.length ? (
            <div>
              <dt>{fa ? "رنگ‌های انتخاب‌شده" : "Selected colours"}</dt>
              <dd>
                <ul className="making-swatches">
                  {swatches.map((swatch) => (
                    <li key={swatch.key}>
                      {swatch.background ? (
                        <i
                          style={{ background: swatch.background }}
                          aria-hidden="true"
                        />
                      ) : null}
                      <span>{swatch.label}</span>
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          ) : null}
          {permission.state === "missing" ? null : (
            <div>
              <dt>{fa ? "اجازه غافلگیری" : "Room for surprise"}</dt>
              <dd>{permission.text}</dd>
            </div>
          )}
        </dl>
      ) : null}
      {voice ? (
        <div className="making-voice">
          <audio
            controls
            src={voice}
            aria-label={fa ? "صدای ایده‌ی شما" : "Your recorded idea"}
            onError={() => setAudioError(true)}
          />
          {audioError ? (
            <p className="making-file-error" role="alert">
              {fa
                ? "این فایل صوتی پخش نشد."
                : "This audio could not be played."}
            </p>
          ) : null}
          <a href={voice} download>
            {fa ? "دانلود صدا" : "Download audio"}
          </a>
        </div>
      ) : null}
      {voiceMissing ? (
        <p className="making-file-error">
          {fa
            ? "فایل صوتی این درخواست در دسترس نیست."
            : "The audio for this request is not available."}
        </p>
      ) : null}
      {images.length ? (
        <ul className="making-brief-images">
          {images.map((src, index) => (
            <BriefImage
              key={`${src.slice(0, 24)}-${index}`}
              src={src}
              alt={t("generatedAlt")}
            />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
