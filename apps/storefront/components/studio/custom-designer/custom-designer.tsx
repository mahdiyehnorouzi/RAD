"use client";
import "./custom-designer.css";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState, type CSSProperties } from "react";
import { useLocale } from "@/components/i18n";
import { useCommerce } from "@/components/commerce";
import { useMaking } from "@/hooks/use-making-workspace";
import { useOnline } from "@/hooks/use-online";
import { StateNotice } from "@/components/ui/state-panel";
import { MakingRequest } from "./making-request";
import { DesignerNav } from "./designer-nav";
import { SparkInput } from "./spark-input";
import { FreedomSlider } from "./freedom-slider";
import { IdeaCard } from "./idea-card";
import { freedomToPermission, useDesigner, useDesignerDraft } from "./hooks";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { artworkCategories } from "@/lib/catalog/artwork";
import { DESIGNER_FEELINGS } from "./const";
import { isNetworkError, isSessionExpired } from "@/lib/api";

type SubmitFailure = "session" | "network" | "failed" | null;

export function CustomDesigner() {
  const { t, locale, number, href } = useLocale();
  const router = useRouter();
  const { goBack: leaveStudio } = useBackNavigation();
  const { user } = useCommerce();
  const { submitDesign } = useMaking();
  const designer = useDesigner();
  const online = useOnline();
  const draftStore = useDesignerDraft(designer.draft, designer.restoreDraft);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [failure, setFailure] = useState<SubmitFailure>(null);
  const signInHref = href("/account?next=/studio");
  const {
    canAdvance,
    category,
    chooseCategory,
    colors,
    error,
    feeling,
    freedom,
    goBack,
    goNext,
    goTo,
    hasVoice,
    ideaNumber,
    intendedUse,
    prompt,
    reachedIndex,
    selectedCategory,
    setError,
    setFeeling,
    setFreedom,
    setHasVoice,
    setIntendedUse,
    setPrompt,
    setSketch,
    setDimensions,
    setBudget,
    dimensions,
    budget,
    sketch,
    step,
    uploads,
  } = designer;
  const feelingLabel = DESIGNER_FEELINGS.find((item) => item.id === feeling)?.label[locale];

  function advance() {
    if (!canAdvance) return;
    startTransition(() => {
      goNext();
    });
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
          prompt.trim().slice(0, 42) ||
          (locale === "fa" ? "ایده استودیو" : "Studio idea");
        const references = [
          prompt.trim(),
          feelingLabel ? `${locale === "fa" ? "حس" : "Mood"}: ${feelingLabel}` : "",
          colors.length ? `${locale === "fa" ? "رنگ" : "Colours"}: ${colors.join(" / ")}` : "",
          `${locale === "fa" ? "آزادی سازنده" : "Maker freedom"}: ${freedom}%`,
          hasVoice ? (locale === "fa" ? "یادداشت صوتی همراه است." : "A voice note is attached.") : "",
        ].filter(Boolean);
        const commission = await submitDesign({
          customerName: user.name,
          title: { fa: titleText, en: titleText },
          brief: {
            concept: references.join("\n") || titleText,
            dimensions: dimensions.trim(),
            material: selectedCategory?.label[locale] ?? "",
            intendedUse,
            budget: budget.trim(),
            permission: freedomToPermission(freedom),
            category: category || "ceramics",
            image: sketch || uploads[0],
            images: [sketch, ...uploads].filter(Boolean),
            colors,
            feeling,
            freedom,
            sketch: sketch || undefined,
            hasVoice,
          },
        });
        draftStore.clear();
        router.push(href(`/making/${commission.id}`));
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

  return (
    <div className="designer-shell">
      <DesignerNav
        step={step}
        reachedIndex={reachedIndex}
        number={number}
        onSelect={goTo}
      />
      <div className="designer-grid">
        <form className="designer-form" onSubmit={(event) => event.preventDefault()} noValidate>
          <h1>{t("designerSparkTitle")}</h1>
          <p className="designer-promise">{t("designerFreeIdea")}</p>

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

          {step === "spark" ? (
            <SparkInput
              prompt={prompt}
              setPrompt={setPrompt}
              uploads={uploads}
              maxImages={designer.maxImages}
              error={error}
              onError={setError}
              onAdd={designer.addUploads}
              onRemove={designer.removeUpload}
              sketch={sketch}
              onSketch={setSketch}
              hasVoice={hasVoice}
              onVoice={setHasVoice}
              colors={colors}
              onToggleColor={designer.toggleColor}
              feeling={feeling}
              onFeeling={setFeeling}
            />
          ) : null}

          {step === "type" ? (
            <fieldset className="design-category-fieldset">
              <legend>
                <small>{t("stepTwo")}</small>
                {t("chooseArtworkType")}
              </legend>
              <div className="design-category-grid">
                {artworkCategories.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={category === item.id ? "active" : ""}
                    onClick={() => chooseCategory(item.id)}
                    aria-pressed={category === item.id}
                  >
                    <span
                      className={`category-swatch ${item.visual}`}
                      style={
                        {
                          "--swatch": item.preview.color,
                          "--swatch-accent": item.preview.accent,
                        } as CSSProperties
                      }
                      aria-hidden="true"
                    />
                    {item.label[locale]}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : null}

          {step === "freedom" ? (
            <FreedomSlider value={freedom} onChange={setFreedom} />
          ) : null}

          {step === "send" ? (
            <MakingRequest
              intendedUse={intendedUse}
              setIntendedUse={setIntendedUse}
              dimensions={dimensions}
              setDimensions={setDimensions}
              budget={budget}
              setBudget={setBudget}
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

          {step !== "send" ? (
            <div className="designer-step-actions">
              <button
                type="button"
                className="button outline designer-back"
                onClick={step === "spark" ? leaveStudio : goBack}
              >
                {t("designerBack")}
              </button>
              <button
                type="button"
                className="button"
                disabled={!canAdvance}
                onClick={advance}
              >
                {t("designerNext")}
              </button>
            </div>
          ) : (
            <div className="designer-step-actions">
              <button type="button" className="button outline designer-back" onClick={goBack}>
                {t("designerBack")}
              </button>
            </div>
          )}
        </form>

        <section className="designer-preview idea-preview" aria-live="polite">
          <IdeaCard
            ideaNumber={ideaNumber}
            prompt={prompt}
            feeling={feeling}
            categoryLabel={selectedCategory?.shortLabel[locale] ?? ""}
            colors={colors}
            uploads={uploads}
            sketch={sketch}
            hasVoice={hasVoice}
            freedom={freedom}
          />
        </section>
      </div>
    </div>
  );
}
