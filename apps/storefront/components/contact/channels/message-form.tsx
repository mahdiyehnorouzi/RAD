"use client";
import "./message-form.css";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { Check, ChevronDown, Send } from "lucide-react";
import {
  CONTACT_TOPICS,
  type ContactSource,
  type ContactTopic,
} from "@rad/types";
import { useLocale } from "@/components/i18n";
import { useCommerce } from "@/components/commerce";
import { errorMessage, isNetworkError, sendContactMessage } from "@/lib/api";
import { CONTACT_TOPIC_LABELS, ORDER_TOPICS, messageFormCopy } from "../const";

type FieldErrors = { contact?: string; body?: string };
type Sent = { contact: string; orderId?: string };

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?\d{7,15}$/;

/** Email stays as typed; a phone number loses spaces and non-Latin digits. */
function normalizeContact(raw: string) {
  const value = raw.trim();
  if (value.includes("@")) return value;
  return value
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[\s()-]/g, "");
}

/**
 * The short form that saves a message in RAD's admin inbox. Given an
 * `orderId`, the message is filed beside that order.
 */
export function MessageForm({
  source,
  orderId,
  subject,
  defaultTopic,
  topics = CONTACT_TOPICS,
  compact = false,
  variant = "inline",
}: {
  source: ContactSource;
  orderId?: string;
  /** Names the work when there is no order yet; saved with the message. */
  subject?: string;
  defaultTopic?: ContactTopic;
  /** One topic hides the picker; the message is filed under it. */
  topics?: readonly ContactTopic[];
  compact?: boolean;
  /** `page` asks for a name, picks the topic from a menu, and labels fields in place. */
  variant?: "inline" | "page";
}) {
  const { locale } = useLocale();
  const c = messageFormCopy[locale];
  const { user } = useCommerce();
  const id = useId();
  const page = variant === "page";
  const [topic, setTopic] = useState<ContactTopic | "">(
    defaultTopic ?? (page ? "" : "other"),
  );
  const [name, setName] = useState("");
  const [orderRef, setOrderRef] = useState("");
  const [contact, setContact] = useState(user?.email ?? "");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const sentRef = useRef<HTMLDivElement>(null);
  const askOrder = !orderId && !subject && topic !== "" && ORDER_TOPICS.includes(topic);

  useEffect(() => {
    if (user?.email) setContact((current) => current || user.email);
  }, [user?.email]);

  useEffect(() => {
    if (defaultTopic) setTopic(defaultTopic);
  }, [defaultTopic]);

  useEffect(() => {
    if (sent) sentRef.current?.focus();
  }, [sent]);

  const validate = (): FieldErrors => {
    const reply = normalizeContact(contact);
    return {
      contact: !reply
        ? orderId
          ? undefined
          : c.contactMissing
        : EMAIL.test(reply) || PHONE.test(reply)
          ? undefined
          : c.contactInvalid,
      body: body.trim().length < 3 ? c.bodyMissing : undefined,
    };
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    const found = validate();
    setErrors(found);
    if (found.contact) return contactRef.current?.focus();
    if (found.body) return bodyRef.current?.focus();

    const reply = normalizeContact(contact);
    try {
      setSending(true);
      setFailure("");
      const notes = [
        subject ? c.subjectLine.replace("{subject}", subject) : "",
        name.trim() ? c.nameLine.replace("{name}", name.trim()) : "",
      ].filter(Boolean);
      const receipt = await sendContactMessage({
        topic: topic || "other",
        source,
        contact: reply || undefined,
        body: [body.trim(), ...notes].join("\n\n").slice(0, 2000),
        orderId: orderId ?? (askOrder && orderRef.trim() ? orderRef.trim() : undefined),
      });
      setSent({ contact: reply, orderId: receipt.orderId });
    } catch (err) {
      setFailure(isNetworkError(err) ? c.failed : errorMessage(err, c.failed));
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setSent(null);
    setBody("");
    setOrderRef("");
    setErrors({});
  };

  if (sent) {
    return (
      <div
        ref={sentRef}
        className={`message-sent${compact ? " is-compact" : ""}`}
        role="status"
        tabIndex={-1}
      >
        <span className="message-sent-mark" aria-hidden="true">
          <Check size={18} strokeWidth={1.8} />
        </span>
        <div>
          <p className="message-sent-title">{c.sentTitle}</p>
          {sent.contact ? (
            <p>
              {c.sentBody.split("{contact}")[0]}
              <bdi dir="ltr">{sent.contact}</bdi>
              {c.sentBody.split("{contact}")[1]}
            </p>
          ) : (
            <p>{c.sentBodyOrder}</p>
          )}
          {sent.orderId ? (
            <p>{c.sentOrder.replace("{id}", sent.orderId)}</p>
          ) : null}
          <button type="button" className="text-button" onClick={reset}>
            {c.another}
          </button>
        </div>
      </div>
    );
  }

  const labelClass = page ? "message-sr" : undefined;

  const topicPicker =
    topics.length < 2 ? null : page ? (
      <div className="message-field message-select">
        <label className={labelClass} htmlFor={`${id}-topic`}>
          {c.topicLabel}
        </label>
        <select
          id={`${id}-topic`}
          name="topic"
          value={topic}
          className={topic ? undefined : "is-empty"}
          onChange={(event) => setTopic(event.target.value as ContactTopic)}
        >
          <option value="" disabled>
            {c.topicLabel}
          </option>
          {topics.map((value) => (
            <option key={value} value={value}>
              {CONTACT_TOPIC_LABELS[value][locale]}
            </option>
          ))}
        </select>
        <ChevronDown className="message-select-icon" size={18} strokeWidth={1.6} aria-hidden="true" />
      </div>
    ) : (
      <fieldset className="message-topics">
        <legend>{c.topicLegend}</legend>
        <div>
          {topics.map((value) => (
            <label key={value} className={topic === value ? "is-picked" : ""}>
              <input
                type="radio"
                name={`${id}-topic`}
                value={value}
                checked={topic === value}
                onChange={() => setTopic(value)}
              />
              <span>{CONTACT_TOPIC_LABELS[value][locale]}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );

  const attached = orderId ? (
    <p className="message-attached">
      {c.orderAttached.split("{id}")[0]}
      <bdi dir="ltr">{orderId}</bdi>
      {c.orderAttached.split("{id}")[1]}
    </p>
  ) : subject ? (
    <p className="message-attached">{c.subjectAttached.replace("{subject}", subject)}</p>
  ) : null;

  const orderField = askOrder ? (
    <div className="message-field">
      <label htmlFor={`${id}-order`}>{c.orderLabel}</label>
      <input
        id={`${id}-order`}
        className="is-ltr"
        dir="ltr"
        inputMode="text"
        autoComplete="off"
        value={orderRef}
        onChange={(event) => setOrderRef(event.target.value)}
        aria-describedby={`${id}-order-hint`}
      />
      <small id={`${id}-order-hint`}>{c.orderHint}</small>
    </div>
  ) : null;

  const nameField = page ? (
    <div className="message-field">
      <label className={labelClass} htmlFor={`${id}-name`}>
        {c.nameLabel}
      </label>
      <input
        id={`${id}-name`}
        name="name"
        type="text"
        autoComplete="name"
        maxLength={80}
        placeholder={c.nameLabel}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
    </div>
  ) : null;

  const contactField = (
    <div className="message-field">
      <label className={labelClass} htmlFor={`${id}-contact`}>
        {c.contactLabel}
      </label>
      <input
        ref={contactRef}
        id={`${id}-contact`}
        name="contact"
        type="text"
        inputMode="email"
        autoComplete="email"
        placeholder={page ? c.contactLabel : c.contactPlaceholder}
        value={contact}
        onChange={(event) => {
          setContact(event.target.value);
          if (errors.contact) setErrors((current) => ({ ...current, contact: undefined }));
        }}
        aria-invalid={errors.contact ? true : undefined}
        aria-describedby={
          errors.contact
            ? `${id}-contact-error`
            : orderId
              ? `${id}-contact-hint`
              : undefined
        }
      />
      {errors.contact ? (
        <small id={`${id}-contact-error`} className="message-field-error">
          {errors.contact}
        </small>
      ) : orderId ? (
        <small id={`${id}-contact-hint`}>{c.contactOrderHint}</small>
      ) : null}
    </div>
  );

  const bodyField = (
    <div className="message-field">
      <label className={labelClass} htmlFor={`${id}-body`}>
        {c.bodyLabel}
      </label>
      <textarea
        ref={bodyRef}
        id={`${id}-body`}
        name="body"
        rows={compact ? 3 : 5}
        maxLength={2000}
        placeholder={page ? c.bodyPagePlaceholder : c.bodyPlaceholder}
        value={body}
        onChange={(event) => {
          setBody(event.target.value);
          if (errors.body) setErrors((current) => ({ ...current, body: undefined }));
        }}
        aria-invalid={errors.body ? true : undefined}
        aria-describedby={errors.body ? `${id}-body-error` : undefined}
      />
      {errors.body ? (
        <small id={`${id}-body-error`} className="message-field-error">
          {errors.body}
        </small>
      ) : null}
    </div>
  );

  return (
    <form
      className={`message-form${compact ? " is-compact" : ""}${page ? " is-page" : ""}`}
      onSubmit={submit}
      noValidate
    >
      {page ? (
        <>
          {nameField}
          {contactField}
          {topicPicker}
          {orderField}
          {bodyField}
        </>
      ) : (
        <>
          {topicPicker}
          {attached}
          {orderField}
          {contactField}
          {bodyField}
        </>
      )}

      {failure ? (
        <p className="message-failure" role="alert">
          {failure}
        </p>
      ) : null}

      <div className="message-submit">
        <button className="button" type="submit" disabled={sending} aria-busy={sending}>
          <span>{sending ? c.sending : c.submit}</span>
          {page ? <Send className="message-send-icon" size={17} strokeWidth={1.6} aria-hidden="true" /> : null}
        </button>
        <small>{c.replyNote}</small>
      </div>
    </form>
  );
}
