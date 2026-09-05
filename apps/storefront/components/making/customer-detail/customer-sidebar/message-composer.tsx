"use client";

import type {LocaleCopy} from "@/types/locale";
import { asCopy } from "@/lib/making";
import { useLocale } from "@/components/i18n";

export function MessageComposer({
  onSend,
  internal = false,
}: {
  onSend: (body: LocaleCopy) => void;
  internal?: boolean;
}) {
  const { locale } = useLocale();
  return (
    <form
      className="making-compose"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const text = String(data.get("body") ?? "").trim();
        if (!text) return;
        onSend(asCopy(text));
        event.currentTarget.reset();
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
      <textarea id={internal ? "internal-note" : "stage-message"} name="body" className="resize-none" />
      <button className="button" type="submit">
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
