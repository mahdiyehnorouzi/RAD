"use client";
import "./help-panel.css";

import { useEffect, useId, useRef, useState } from "react";
import { Check, Copy, Info, MessageSquareText, Send, X } from "lucide-react";
import { useLocale } from "@/components/i18n";
import { InstagramIcon, MessageForm } from "./channels";
import { RAD_INSTAGRAM, helpPanelCopy } from "./const";
import type { HelpContext, HelpTone } from "./type";

/**
 * Help that never navigates away: Direct opens in a new tab, the copied
 * text carries the order number, and the inline form files the message
 * beside the order in RAD's admin.
 */
export function HelpPanel({
  context,
  tone = "payment",
  orderId,
  subject,
}: {
  context: HelpContext;
  tone?: HelpTone;
  orderId?: string;
  /** Names the work in the copied text when there is no order yet. */
  subject?: string;
}) {
  const { locale } = useLocale();
  const c = helpPanelCopy[locale];
  const id = useId();
  const [writing, setWriting] = useState(false);
  const [opened, setOpened] = useState(false);
  const [copy, setCopy] = useState<"idle" | "copied" | "failed">("idle");
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const title =
    context === "checkout"
      ? c.checkoutTitle
      : tone === "payment"
        ? c.paymentTitle
        : c.orderTitle;
  const template = orderId
    ? c.templateOrder.replace("{id}", orderId)
    : subject
      ? c.templateSubject.replace("{subject}", subject)
      : c.templatePlain;
  const copyNote = orderId
    ? c.copyNoteOrder
    : subject
      ? c.copyNoteSubject
      : null;
  const topic = tone === "payment" ? "payment" : "order";

  const copyText = async () => {
    window.clearTimeout(resetTimer.current);
    try {
      await navigator.clipboard.writeText(`${template}\n`);
      setCopy("copied");
      resetTimer.current = window.setTimeout(() => setCopy("idle"), 2200);
    } catch {
      setCopy("failed");
    }
  };

  const toggleForm = () => {
    setOpened(true);
    setWriting((open) => !open);
  };

  return (
    <section
      className={`help-panel is-${context}`}
      aria-labelledby={`${id}-title`}
    >
      {context === "order" ? (
        <span className="help-panel-eyebrow">{c.orderEyebrow}</span>
      ) : null}
      <h2 id={`${id}-title`}>{title}</h2>
      <p className="help-panel-body">
        {context === "checkout" ? c.checkoutBody : c.orderBody}
      </p>

      <div className="help-panel-actions">
        <a
          className="help-action is-primary"
          href={RAD_INSTAGRAM.directUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={c.directLabel}
        >
          {context === "order" ? (
            <Send size={18} strokeWidth={1.6} aria-hidden="true" />
          ) : (
            <InstagramIcon size={18} />
          )}
          <span>{c.direct}</span>
        </a>
        <button type="button" className="help-action" onClick={copyText}>
          {copy === "copied" ? (
            <Check size={18} strokeWidth={1.7} aria-hidden="true" />
          ) : (
            <Copy size={18} strokeWidth={1.6} aria-hidden="true" />
          )}
          <span>{copy === "copied" ? c.copied : c.copy}</span>
        </button>
        <button
          type="button"
          className="help-action is-quiet"
          aria-expanded={writing}
          aria-controls={`${id}-form`}
          onClick={toggleForm}
        >
          {writing ? (
            <X size={17} strokeWidth={1.6} aria-hidden="true" />
          ) : (
            <MessageSquareText size={17} strokeWidth={1.6} aria-hidden="true" />
          )}
          <span>{writing ? c.closeWrite : c.write}</span>
        </button>
      </div>

      <span className="help-panel-live" aria-live="polite">
        {copy === "copied" ? c.copied : ""}
      </span>

      {copy === "failed" ? (
        <div className="help-panel-fallback" role="alert">
          <p>{c.copyFailed}</p>
          <output>{template}</output>
        </div>
      ) : copyNote ? (
        <p className="help-panel-note">
          {context === "order" ? (
            <Info size={18} strokeWidth={1.6} aria-hidden="true" />
          ) : null}
          <span>{copyNote}</span>
        </p>
      ) : null}

      <div id={`${id}-form`} className="help-panel-form" hidden={!writing}>
        {opened ? (
          <MessageForm
            compact
            source={context}
            orderId={orderId}
            subject={orderId ? undefined : subject}
            defaultTopic={topic}
            topics={[topic]}
          />
        ) : null}
      </div>
    </section>
  );
}
