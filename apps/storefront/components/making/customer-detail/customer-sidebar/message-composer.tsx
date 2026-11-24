"use client";

import { useRef, useState } from "react";
import type { LocaleCopy } from "@/types/locale";
import { asCopy } from "@/lib/making";
import { useLocale } from "@/components/i18n";
import "./customer-sidebar.css";

export function MessageComposer({
  onSend,
  internal = false,
}: {
  onSend: (body: LocaleCopy, operationId: string) => void | Promise<void>;
  internal?: boolean;
}) {
  const { locale } = useLocale();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<string | null>(null);
  const inFlight = useRef(false);
  return (
    <form
      className="making-compose"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (inFlight.current) return;
        const form = event.currentTarget;
        const data = new FormData(form);
        const text = String(data.get("body") ?? "").trim();
        if (!text) return;
        const operationId = pending.current ?? crypto.randomUUID();
        pending.current = operationId;
        inFlight.current = true;
        setSending(true);
        setError("");
        // Only clear the draft once the server has accepted the message -
        // a failed send must leave the typed text in place, not wipe it.
        void Promise.resolve()
          .then(() => onSend(asCopy(text), operationId))
          .then(() => {
            pending.current = null;
            form.reset();
          })
          .catch((err) =>
            setError(
              err instanceof Error && err.message
                ? err.message
                : locale === "fa"
                  ? "ارسال پیام ناموفق بود. متن پیام حفظ شده است."
                  : "Sending failed. Your message was kept.",
            ),
          )
          .finally(() => {
            inFlight.current = false;
            setSending(false);
          });
      }}
    >
      <label htmlFor={internal ? "internal-note" : "stage-message"}>
        {internal
          ? locale === "fa"
            ? "یادداشت داخلی (برای مشتری دیده نمی‌شود)"
            : "Internal note (invisible to the customer)"
          : locale === "fa"
            ? "پیام این مرحله"
            : "Message for this stage"}
      </label>
      <textarea
        id={internal ? "internal-note" : "stage-message"}
        name="body"
        onChange={() => {
          pending.current = null;
        }}
        className="resize-none"
        disabled={sending}
      />
      {error ? (
        <p className="making-compose-error" role="alert">
          {error}
        </p>
      ) : null}
      <button className="button" type="submit" disabled={sending}>
        {internal
          ? locale === "fa"
            ? "ثبت یادداشت"
            : "Save note"
          : locale === "fa"
            ? "چسباندن به این مرحله"
            : "Attach to this stage"}
      </button>
    </form>
  );
}
