"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Pencil } from "lucide-react";
import { useLocale } from "@/components/i18n";
import type { Designer } from "./hooks";
import {
  BUDGET_OPTIONS,
  DESIGNER_COLORS,
  FORM_OPTIONS,
  SIZE_OPTIONS,
  TIMELINE_OPTIONS,
  colorLabel,
  optionLabel,
} from "./const";
import styles from "./review-phase.module.css";

type EditTarget = "idea" | "category" | "size" | "color" | "similarity" | "budget" | "timeline";

export function ReviewPhase({
  designer: d,
  onEdit,
  onSubmit,
  submitting,
  offline,
  error,
  notices,
}: {
  designer: Designer;
  onEdit: (target: EditTarget) => void;
  onSubmit: () => void;
  submitting: boolean;
  offline: boolean;
  error: string;
  notices: ReactNode;
}) {
  const { locale, href } = useLocale();
  const fa = locale === "fa";
  const txt = (faText: string, en: string) => (fa ? faText : en);
  const hasReference = Boolean(d.uploads.length || d.sketch);
  const images = [...d.uploads, d.sketch].filter(Boolean);

  function swatchColor(value: string) {
    const match = DESIGNER_COLORS.find((o) => o.value === value);
    return match && "background" in match ? match.background : value;
  }

  const details: Array<{
    label: string;
    value: string;
    target: EditTarget;
    swatches?: string[];
  }> = [
    {
      label: txt("چی بسازیم؟", "Object"),
      value: optionLabel(FORM_OPTIONS, d.form, locale),
      target: "category",
    },
    {
      label: txt("اندازه", "Size"),
      value: [
        optionLabel(SIZE_OPTIONS, d.size, locale),
        [d.length, d.width, d.height].filter(Boolean).join(" × "),
      ]
        .filter(Boolean)
        .join(" — "),
      target: "size",
    },
    {
      label: txt("رنگ", "Color"),
      value: [...d.colors.map((v) => colorLabel(v, locale)), d.colorNote]
        .filter(Boolean)
        .join("، "),
      target: "color",
      swatches: d.colors,
    },
    ...(hasReference
      ? [
          {
            label: txt("شباهت به مرجع", "Reference similarity"),
            value: [
              txt("کاملاً شبیه", "Very close"),
              txt("با کمی تغییر", "Some changes"),
              txt("فقط الهام بگیریم", "Just inspiration"),
            ][Math.min(2, Math.floor(d.freedom / 50))],
            target: "similarity" as const,
          },
        ]
      : []),
    {
      label: txt("بودجه", "Budget"),
      value: optionLabel(BUDGET_OPTIONS, d.budget, locale),
      target: "budget",
    },
    {
      label: txt("زمان", "Time"),
      value: d.needBy || optionLabel(TIMELINE_OPTIONS, d.timeline, locale),
      target: "timeline",
    },
  ];

  return (
    <div className={styles.review}>
      <h1 className={styles.title}>{txt("ایده‌ی شما", "Your idea")}</h1>
      <p className={styles.hint}>
        {txt(
          "این خلاصه‌ای از چیزیه که برامون فرستادی.",
          "Here’s what you’ve shared with us.",
        )}
      </p>
      {notices}

      <section className={styles.board} aria-label={txt("تخته‌ی ایده", "Idea board")}>
        <button
          type="button"
          className={styles.boardEdit}
          onClick={() => onEdit("idea")}
          aria-label={txt("ویرایش ایده", "Edit idea")}
        >
          <Pencil aria-hidden="true" />
          {txt("ویرایش", "Edit")}
        </button>
        {images.length ? (
          <div className={styles.collage} data-count={Math.min(images.length, 4)}>
            {images.slice(0, 4).map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={src} alt={txt("مرجع ایده", "Idea reference")} />
            ))}
          </div>
        ) : (
          <div className={styles.collagePlaceholder}>
            {d.form ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={FORM_OPTIONS.find((o) => o.id === d.form)?.image}
                alt=""
              />
            ) : (
              <Pencil aria-hidden="true" />
            )}
          </div>
        )}
        {d.prompt && <p className={styles.brief}>{d.prompt}</p>}
        {d.voice && (
          <div className={styles.voiceRow}>
            <audio controls src={d.voice} />
          </div>
        )}
      </section>

      <div className={styles.details}>
        {details.map((row) => (
          <div key={row.target} className={styles.detailRow}>
            <span className={styles.detailLabel}>{row.label}</span>
            <span className={styles.detailValue}>
              {row.swatches && row.swatches.length ? (
                <span className={styles.detailSwatches}>
                  {row.swatches.map((v) => (
                    <i
                      key={v}
                      style={{ background: swatchColor(v) }}
                      aria-hidden="true"
                    />
                  ))}
                </span>
              ) : null}
              {row.value || "—"}
            </span>
            <button
              type="button"
              className={styles.detailEdit}
              onClick={() => onEdit(row.target)}
            >
              <Pencil aria-hidden="true" />
              {txt("ویرایش", "Edit")}
            </button>
          </div>
        ))}
      </div>

      <p className={styles.callout}>
        {txt(
          "این یک درخواسته، نه خرید قطعی. ایده‌ات رو بررسی می‌کنیم و قیمت و زمان دقیق رو بهت می‌گیم. تا قبل از تأیید، پرداختی نداری.",
          "This is a request, not a purchase. We’ll review your idea and confirm final price and timing. No payment is due before you approve.",
        )}
      </p>
      <label className={styles.consent}>
        <input
          type="checkbox"
          checked={d.agreed}
          onChange={(e) => d.setAgreed(e.target.checked)}
        />
        <span>
          {txt("شرایط ", "I accept the ")}
          <Link href={href("/help/custom")} target="_blank">
            {txt("سفارش اختصاصی", "custom-order terms")}
          </Link>
          {fa ? " را می‌پذیرم." : "."}
        </span>
      </label>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
      <button
        type="button"
        className={styles.submit}
        disabled={!d.canSubmit || submitting || offline}
        onClick={onSubmit}
      >
        {submitting
          ? txt("در حال ارسال…", "Sending…")
          : txt("ثبت درخواست ساخت", "Send the request")}
      </button>
    </div>
  );
}
