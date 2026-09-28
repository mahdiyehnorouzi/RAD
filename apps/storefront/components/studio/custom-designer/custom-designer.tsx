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
import { DesignerNav } from "./designer-nav";
import { IdeaStep } from "./idea-step";
import { FormStep } from "./form-step";
import { DetailsStep } from "./details-step";
import { PlanStep } from "./plan-step";
import { ReviewStep } from "./review-step";
import { SentNotice } from "./sent-notice";
import { IdeaCard } from "./idea-card";
import { freedomToPermission, useDesigner, useDesignerDraft } from "./hooks";
import {
  BUDGET_OPTIONS,
  DATED_TIMELINE,
  FORM_OPTIONS,
  SIZE_OPTIONS,
  TIMELINE_OPTIONS,
  colorLabel,
  designerCopy,
  fidelityKey,
  optionLabel,
  type DesignerStep,
} from "./const";

type SubmitFailure = "session" | "network" | "failed" | null;

export function CustomDesigner({ title }: { title: string }) {
  const { t, locale, href } = useLocale();
  const c = designerCopy[locale];
  const router = useRouter();
  const { user } = useCommerce();
  const { submitDesign } = useMaking();
  const designer = useDesigner();
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
    const forms = designer.forms.map((id) =>
      optionLabel(FORM_OPTIONS, id, locale),
    );
    const size = SIZE_OPTIONS[designer.sizeIndex];
    const sizeText = size ? `${size.label[locale]} (${size.hint[locale]})` : "";
    const time =
      designer.timeline === DATED_TIMELINE && designer.needBy.trim()
        ? `${optionLabel(TIMELINE_OPTIONS, designer.timeline, locale)}: ${designer.needBy.trim()}`
        : optionLabel(TIMELINE_OPTIONS, designer.timeline, locale);
    const concept = [
      designer.prompt.trim(),
      forms.length ? `${c.conceptForm}: ${forms.join(separator)}` : "",
      `${c.conceptSize}: ${[sizeText, designer.dimensions.trim()].filter(Boolean).join(" — ")}`,
      designer.colors.length
        ? `${c.conceptColors}: ${designer.colors
            .map((color) => {
              const name = colorLabel(color, locale);
              return name === color ? color : `${name} (${color})`;
            })
            .join(" / ")}`
        : "",
      `${c.conceptFidelity}: ${c[fidelityKey(designer.freedom)]}`,
      time ? `${c.conceptTime}: ${time}` : "",
      designer.hasVoice ? c.conceptVoice : "",
    ].filter(Boolean);
    const category =
      FORM_OPTIONS.find((option) => option.id === designer.forms[0])
        ?.category ?? "ceramics";
    return {
      concept: concept.join("\n"),
      dimensions: [sizeText, designer.dimensions.trim()]
        .filter(Boolean)
        .join(" — "),
      material: "",
      intendedUse: forms.join(separator),
      budget: optionLabel(BUDGET_OPTIONS, designer.budget, locale),
      permission: freedomToPermission(designer.freedom),
      category,
      image: designer.sketch || designer.uploads[0],
      images: [designer.sketch, ...designer.uploads].filter(Boolean),
      colors: designer.colors,
      freedom: designer.freedom,
      sketch: designer.sketch || undefined,
      hasVoice: designer.hasVoice,
      forms: designer.forms,
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
      <div className="designer-shell" ref={shell}>
        <h2 className="designer-title">{title}</h2>
        <SentNotice commissionId={sentId} onAnother={startAnother} />
      </div>
    );
  }

  return (
    <div className="designer-shell" ref={shell}>
      <h2 className="designer-title">{title}</h2>
      <DesignerNav
        step={step}
        reachedIndex={designer.reachedIndex}
        onSelect={moveTo}
      />
      <div className="designer-grid">
        <form
          className="designer-form"
          onSubmit={(event) => event.preventDefault()}
          noValidate
        >
          {!online || draftStore.restored ? (
            <div className="designer-notices">
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

          <div className="designer-step-actions">
            {step !== "idea" ? (
              <button
                type="button"
                className="button outline designer-back"
                onClick={retreat}
                disabled={submitting}
              >
                {t("designerBack")}
              </button>
            ) : (
              <span />
            )}
            {step !== "review" ? (
              <button
                type="button"
                className="button"
                disabled={!canAdvance}
                onClick={advance}
              >
                {t("designerNext")}
              </button>
            ) : null}
          </div>
        </form>

        <aside className="designer-preview idea-preview" aria-live="polite">
          <IdeaCard designer={designer} />
        </aside>
      </div>
    </div>
  );
}
