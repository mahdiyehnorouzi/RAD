"use client";
import "./custom-designer.css";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useRef, useState } from "react";
import { COMMISSION_POLICY_SLUGS, currentPolicyVersions } from "@rad/types";
import { useLocale } from "@/components/i18n";
import { useCommerce } from "@/components/commerce";
import { useMaking } from "@/hooks/use-making-workspace";
import { useOnline } from "@/hooks/use-online";
import { StateNotice } from "@/components/ui/state-panel";
import { isNetworkError, isSessionExpired } from "@/lib/api";
import { StudioIcon, readingArrow } from "../studio-icon";
import { DesignerNav } from "./designer-nav";
import { IdeaStep } from "./idea-step";
import { FormStep } from "./form-step";
import { DetailsStep } from "./details-step";
import { PlanStep } from "./plan-step";
import { ReviewStep } from "./review-step";
import { SentNotice } from "./sent-notice";
import { freedomToPermission, useDesignerDraft, type Designer } from "./hooks";
import {
  BUDGET_OPTIONS,
  DATED_TIMELINE,
  FORM_OPTIONS,
  SIZE_OPTIONS,
  TIMELINE_OPTIONS,
  USE_OPTIONS,
  colorLabel,
  designerCopy,
  fidelityKey,
  optionLabel,
  type DesignerStep,
} from "./const";

type SubmitFailure = "session" | "network" | "failed" | null;

export function CustomDesigner({ designer }: { designer: Designer }) {
  const { t, locale, href } = useLocale();
  const c = designerCopy[locale];
  const router = useRouter();
  const { user } = useCommerce();
  const { submitDesign } = useMaking();
  const online = useOnline();
  const draftStore = useDesignerDraft(designer.draft, designer.restoreDraft);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [failure, setFailure] = useState<SubmitFailure>(null);
  const [sentId, setSentId] = useState("");
  const shell = useRef<HTMLDivElement>(null);
  const signInHref = href(
    `/account?returnTo=${encodeURIComponent("/studio#your-idea")}`,
  );
  const { canAdvance, goBack, goNext, goTo, step } = designer;

  function keepInView() {
    const top = shell.current?.getBoundingClientRect().top ?? 0;
    if (top < 0) shell.current?.scrollIntoView({ block: "start" });
  }

  function moveTo(next: DesignerStep) {
    goTo(next);
    keepInView();
  }

  function advance() {
    if (!canAdvance) return;
    startTransition(() => {
      goNext();
    });
    keepInView();
  }

  function retreat() {
    goBack();
    keepInView();
  }

  function buildBrief() {
    const separator = locale === "fa" ? "، " : ", ";
    const form = optionLabel(FORM_OPTIONS, designer.form, locale);
    const uses = designer.uses.map((id) => optionLabel(USE_OPTIONS, id, locale));
    const size = SIZE_OPTIONS.find((option) => option.id === designer.size);
    const sizeText = size ? `${size.label[locale]} (${size.hint[locale]})` : "";
    const exact = [
      [c.length, designer.length],
      [c.width, designer.width],
      [c.height, designer.height],
    ]
      .filter(([, value]) => value.trim())
      .map(([label, value]) => `${label} ${value.trim()} ${c.unit}`)
      .join(" × ");
    const dimensions = [sizeText, exact].filter(Boolean).join(" — ");
    const time =
      designer.timeline === DATED_TIMELINE && designer.needBy.trim()
        ? `${optionLabel(TIMELINE_OPTIONS, designer.timeline, locale)}: ${designer.needBy.trim()}`
        : optionLabel(TIMELINE_OPTIONS, designer.timeline, locale);
    const colors = [
      ...designer.colors.map((color) => {
        const name = colorLabel(color, locale);
        return name === color ? color : `${name} (${color})`;
      }),
      designer.colorNote.trim(),
    ].filter(Boolean);
    const concept = [
      designer.prompt.trim(),
      form ? `${c.conceptForm}: ${form}` : "",
      uses.length ? `${c.conceptUse}: ${uses.join(separator)}` : "",
      dimensions ? `${c.conceptSize}: ${dimensions}` : "",
      colors.length ? `${c.conceptColors}: ${colors.join(" / ")}` : "",
      `${c.conceptFidelity}: ${c[fidelityKey(designer.freedom)]}`,
      time ? `${c.conceptTime}: ${time}` : "",
      designer.hasVoice ? c.conceptVoice : "",
    ].filter(Boolean);
    const category =
      FORM_OPTIONS.find((option) => option.id === designer.form)?.category ??
      "ceramics";
    return {
      concept: concept.join("\n"),
      dimensions,
      material: "",
      intendedUse: [form, ...uses].filter(Boolean).join(separator),
      budget: optionLabel(BUDGET_OPTIONS, designer.budget, locale),
      permission: freedomToPermission(designer.freedom),
      category,
      image: designer.sketch || designer.uploads[0],
      images: [designer.sketch, ...designer.uploads].filter(Boolean),
      colors: designer.colors,
      freedom: designer.freedom,
      sketch: designer.sketch || undefined,
      hasVoice: designer.hasVoice,
      forms: designer.form ? [designer.form] : [],
      size: size?.id,
      timeline: time,
    };
  }

  function submitCommission() {
    if (!canAdvance || submitting) return;
    if (!online) {
      setFailure("network");
      setSubmitError(t("designerOffline"));
      return;
    }
    if (!user) {
      setSubmitError(t("designerNeedAccount"));
      router.push(signInHref);
      return;
    }
    void (async () => {
      try {
        setSubmitting(true);
        setSubmitError("");
        setFailure(null);
        const titleText =
          designer.prompt.trim().slice(0, 42) || c.fallbackTitle;
        const commission = await submitDesign({
          customerName: user.name,
          title: { fa: titleText, en: titleText },
          brief: buildBrief(),
          acceptedPolicies: currentPolicyVersions(COMMISSION_POLICY_SLUGS),
        });
        draftStore.clear();
        setSentId(commission.id);
        keepInView();
      } catch (err) {
        const kind: SubmitFailure = isSessionExpired(err)
          ? "session"
          : isNetworkError(err)
            ? "network"
            : "failed";
        setFailure(kind);
        setSubmitError(
          kind === "session"
            ? t("designerSessionExpired")
            : kind === "network"
              ? t("designerSubmitNetwork")
              : t("designerSubmitFailed"),
        );
      } finally {
        setSubmitting(false);
      }
    })();
  }

  function startAnother() {
    draftStore.reset();
    setSentId("");
    setSubmitError("");
    setFailure(null);
  }

  if (sentId) {
    return (
      <div className="cd-shell" ref={shell}>
        <SentNotice commissionId={sentId} onAnother={startAnother} />
      </div>
    );
  }

  return (
    <div className="cd-shell" ref={shell}>
      <DesignerNav
        step={step}
        reachedIndex={designer.reachedIndex}
        onSelect={moveTo}
      />
      <form
        className="cd-form"
        onSubmit={(event) => event.preventDefault()}
        noValidate
      >
        {!online || draftStore.restored ? (
          <div className="cd-notices">
            {!online ? (
              <StateNotice tone="error">
                <p>{t("designerOffline")}</p>
              </StateNotice>
            ) : null}
            {draftStore.restored ? (
              <StateNotice
                action={
                  <button
                    type="button"
                    className="state-action"
                    onClick={draftStore.discard}
                  >
                    {t("designerDraftDiscard")}
                  </button>
                }
              >
                <p>{t("designerDraftRestored")}</p>
              </StateNotice>
            ) : null}
          </div>
        ) : null}

        <div className="cd-step-body" key={step}>
          {step === "idea" ? <IdeaStep designer={designer} /> : null}
          {step === "form" ? <FormStep designer={designer} /> : null}
          {step === "details" ? <DetailsStep designer={designer} /> : null}
          {step === "plan" ? <PlanStep designer={designer} /> : null}
          {step === "review" ? (
            <ReviewStep
              designer={{ ...designer, goTo: moveTo }}
              onSubmit={submitCommission}
              submitting={submitting}
              offline={!online}
              error={submitError}
              errorAction={
                failure === "session" ? (
                  <Link href={signInHref}>{t("designerSignInAgain")}</Link>
                ) : null
              }
            />
          ) : null}
        </div>

        {step !== "review" ? (
          <div className={`cd-actions${step === "idea" ? " is-single" : ""}`}>
            {step !== "idea" ? (
              <button
                type="button"
                className="cd-back"
                onClick={retreat}
                disabled={submitting}
              >
                <StudioIcon name={readingArrow(locale, "back")} size={18} />
                <span>{c.back}</span>
              </button>
            ) : null}
            <button
              type="button"
              className="cs-btn cs-btn-solid cd-next"
              disabled={!canAdvance}
              onClick={advance}
            >
              <span>{c.next}</span>
              <StudioIcon name={readingArrow(locale, "forward")} size={20} />
            </button>
          </div>
        ) : null}
      </form>
    </div>
  );
}
