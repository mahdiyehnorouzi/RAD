"use client";

import { useState } from "react";
import type {LocaleCopy} from "@/types/locale";
import { asCopy } from "@/lib/making";
import { useLocale } from "@/components/i18n";
import "./customer-sidebar.css";

export function MessageComposer({
  onSend,
  internal = false,
}: {
  onSend: (body: LocaleCopy) => void | Promise<void>;
  internal?: boolean;
}) {
  const { locale } = useLocale();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      className="making-compose"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        if (sending) return;
        const form = event.currentTarget;
        const data = new FormData(form);
        const text = String(data.get("body") ?? "").trim();
        if (!text) return;
        setSending(true);
        setError("");
        // Only clear the draft once the server has accepted the message -
        // a failed send must leave the typed text in place, not wipe it.
        void Promise.resolve(onSend(asCopy(text)))
          .then(() => form.reset())
          .catch((err) =>
            setError(
              err instanceof Error && err.message
                ? err.message
                : locale === "fa"
                  ? "ارسال پیام ناموفق بود. متن پیام حفظ شده است."
                  : "Sending failed. Your message was kept.",
            ),
          )
          .finally(() => setSending(false));
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
