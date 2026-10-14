"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";
import { useLocale } from "@/components/i18n";
import type { Designer } from "./hooks";
import { IdeaPhase } from "./idea-phase";
import { ChoicesPhase } from "./choices-phase";
import { ReviewPhase } from "./review-phase";
import { OrderProgress } from "./order-progress";
import { useScrollToSection } from "./hooks/use-scroll-to-section";
import { sectionOrder, type ChoicesSectionId } from "./type/choices-section";
import { type OrderPhase, phaseFromFlowScreen } from "./type/order-phase";
import "./custom-designer-shell.css";
import styles from "./order-flow.module.css";

type EditTarget = "idea" | ChoicesSectionId;

/**
 * The single owner of "where is the visitor in this flow" state.
 *
 * `d.flowScreen` (persisted in the draft) only tracks which of the three
 * *phases* we're in — see `phaseFromFlowScreen`. Everything about where
 * inside the Choices phase the visitor has reached (`choicesReachedIndex`,
 * `choicesOpenId`) lives here too, as plain state, so that navigating away
 * from Choices (to Idea or Review) and back never loses or resets that
 * position — there is nothing to "restore", because nothing was torn down.
 */
export function OrderFlow({
  designer: d,
  onSubmit,
  onReset,
  submitting,
  offline,
  error,
  notices,
}: {
  designer: Designer;
  onSubmit: () => void;
  onReset: () => void;
  submitting: boolean;
  offline: boolean;
  error: string;
  notices: ReactNode;
}) {
  const { locale, href } = useLocale();
  const fa = locale === "fa";
  const txt = (faText: string, en: string) => (fa ? faText : en);
  const [phase, setPhaseState] = useState<OrderPhase>(() =>
    phaseFromFlowScreen(d.flowScreen),
  );
  const [editingFromReview, setEditingFromReview] = useState(false);
  const hasReference = Boolean(d.uploads.length || d.sketch);
  const [choicesReachedIndex, setChoicesReachedIndex] = useState(0);
  const [choicesOpenId, setChoicesOpenId] = useState<ChoicesSectionId>(
    sectionOrder(hasReference)[0],
  );
  const [resetKey, setResetKey] = useState(0);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const first = useRef(true);
  const lastOwnFlowScreen = useRef(d.flowScreen);
  const { register, registerSticky, scrollToSection } = useScrollToSection();

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [phase]);

  // The draft restores asynchronously after mount (localStorage read in an
  // effect), updating `d.flowScreen` without going through `setPhase`.
  // Re-sync the visible phase whenever flowScreen changes from outside.
  useEffect(() => {
    if (d.flowScreen === lastOwnFlowScreen.current) return;
    lastOwnFlowScreen.current = d.flowScreen;
    setEditingFromReview(false);
    setPhaseState(phaseFromFlowScreen(d.flowScreen));
  }, [d.flowScreen]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (confirmingReset && !el.open) el.showModal();
    if (!confirmingReset && el.open) el.close();
  }, [confirmingReset]);

  function setPhase(next: OrderPhase) {
    const nextScreen =
      next === "idea" ? "choose" : next === "review" ? "review" : "form";
    lastOwnFlowScreen.current = nextScreen;
    setPhaseState(next);
    d.setFlowScreen(nextScreen);
  }

  function goIdea() {
    setEditingFromReview(false);
    setPhase("idea");
  }
  function goChoices() {
    setEditingFromReview(false);
    setPhase("choices");
  }
  function goReview() {
    setEditingFromReview(false);
    setPhase("review");
  }
  function handleEdit(target: EditTarget) {
    setEditingFromReview(true);
    if (target === "idea") {
      setPhase("idea");
    } else {
      setChoicesReachedIndex(sectionOrder(hasReference).length - 1);
      setChoicesOpenId(target);
      setPhase("choices");
    }
  }

  function handleBack() {
    if (phase === "review") {
      goChoices();
      return;
    }
    if (phase === "choices") {
      if (editingFromReview) goReview();
      else goIdea();
      return;
    }
    // phase === "idea"
    if (editingFromReview) goReview();
  }

  function confirmReset() {
    onReset();
    setEditingFromReview(false);
    setChoicesReachedIndex(0);
    setChoicesOpenId(sectionOrder(false)[0]);
    setPhase("idea");
    setResetKey((k) => k + 1);
    setConfirmingReset(false);
    window.scrollTo({ top: 0, behavior: "instant" });
  }

  const showBackButton = phase !== "idea" || editingFromReview;

  return (
    <div className={styles.flow} dir={fa ? "rtl" : "ltr"}>
      <header className={styles.top} ref={registerSticky}>
        <div className={styles.topRow}>
          {showBackButton ? (
            <button
              type="button"
              className={styles.back}
              onClick={handleBack}
              aria-label={txt("بازگشت", "Back")}
            >
              {fa ? <ChevronRight /> : <ChevronLeft />}
            </button>
          ) : (
            <Link
              href={href("/studio")}
              className={styles.back}
              aria-label={txt("بازگشت به استودیو", "Back to studio")}
            >
              {fa ? <ChevronRight /> : <ChevronLeft />}
            </Link>
          )}
          <button
            type="button"
            className={styles.reset}
            onClick={() => setConfirmingReset(true)}
            aria-label={txt("شروع دوباره", "Start over")}
          >
            <RotateCcw aria-hidden="true" />
          </button>
        </div>
        <OrderProgress phase={phase} />
      </header>
      {phase !== "review" && notices}
      <section className={styles.body} key={resetKey}>
        {phase === "idea" && (
          <IdeaPhase
            designer={d}
            onContinue={editingFromReview ? goReview : goChoices}
          />
        )}
        {phase === "choices" && (
          <ChoicesPhase
            designer={d}
            hasReference={hasReference}
            onDone={goReview}
            editingFromReview={editingFromReview}
            reachedIndex={choicesReachedIndex}
            openId={choicesOpenId}
            onReachedIndexChange={setChoicesReachedIndex}
            onOpenIdChange={setChoicesOpenId}
            registerSection={register}
            scrollToSection={scrollToSection}
          />
        )}
        {phase === "review" && (
          <ReviewPhase
            designer={d}
            onEdit={handleEdit}
            onSubmit={onSubmit}
            submitting={submitting}
            offline={offline}
            error={error}
            notices={notices}
          />
        )}
      </section>
      <dialog
        ref={dialog}
        className={styles.dialog}
        onClose={() => setConfirmingReset(false)}
      >
        <h2>{txt("از اول شروع کنیم؟", "Start over?")}</h2>
        <p>
          {txt(
            "اگه از اول شروع کنی، اطلاعات این سفارش پاک می‌شن.",
            "Starting over clears everything you've entered for this order.",
          )}
        </p>
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={styles.dialogCancel}
            onClick={() => setConfirmingReset(false)}
          >
            {txt("بی‌خیال", "Never mind")}
          </button>
          <button
            type="button"
            className={styles.dialogConfirm}
            onClick={confirmReset}
          >
            {txt("شروع دوباره", "Start over")}
          </button>
        </div>
      </dialog>
    </div>
  );
}
