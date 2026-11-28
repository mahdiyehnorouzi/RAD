import * as React from "react";
import { useEffect, useRef, useState } from "react";
import "./message-composer.css";

/**
 * Whether Enter should submit at all on this device. There is no Shift
 * key on a touch keyboard, so if Enter also sent on a touch device the
 * admin would have no way left to type a deliberate newline — Enter must
 * stay a plain newline there, every time, and sending goes through the
 * button only. `(pointer: coarse)` is the standard signal for "the
 * primary input is a finger, not a mouse"; this re-checks on orientation
 * change / an external keyboard being attached, rather than caching the
 * device type once at mount.
 */
function useEnterToSendAllowed(): boolean {
  const [allowed, setAllowed] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(pointer: coarse)");
    const sync = () => setAllowed(!query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  return allowed;
}

export interface AdminMessageComposerProps {
  value: string;
  onChange: (value: string) => void;
  /** Called on submit (send button, or Enter without Shift). The caller
   * owns validation, persistence and idempotency — this component is
   * presentation only. */
  onSend: () => void;
  /** Blocks sending without changing the textarea's own enabled look
   * (e.g. a read-only role) — pair with a reason shown elsewhere. */
  disabled?: boolean;
  /** An in-flight send: disables the textarea and send button without
   * changing their layout. */
  sending?: boolean;
  placeholder?: string;
  /** Accessible name for the icon-only send button. */
  sendLabel?: string;
  id?: string;
  error?: string;
  errorAction?: { label: string; onClick: () => void };
}

/**
 * The one message-composer shape for the admin panel: a Telegram-style
 * textarea that grows with its content (up to a capped height, then
 * scrolls) plus an attached send button, Enter-to-send / Shift+Enter for
 * a newline. Used in the inbox, regular order threads, and Custom Order
 * threads — those keep owning what happens on send (idempotency keys,
 * single-flight guards, optimistic state), this only owns the input UI.
 */
export function AdminMessageComposer({
  value,
  onChange,
  onSend,
  disabled = false,
  sending = false,
  placeholder,
  sendLabel = "ارسال پیام",
  id,
  error,
  errorAction,
}: AdminMessageComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const enterToSendAllowed = useEnterToSendAllowed();

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const canSend = !disabled && !sending && value.trim().length > 0;

  return (
    <div className="rad-message-composer">
      <form
        className="rad-message-composer-row"
        onSubmit={(event) => {
          event.preventDefault();
          if (canSend) onSend();
        }}
      >
        <textarea
          id={id}
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.shiftKey) return;
            // This Enter may be confirming an IME composition candidate
            // (predictive text, an accent/combining-character picker, a
            // CJK candidate list) rather than submitting the message —
            // `isComposing` is the standard signal; `keyCode === 229` is
            // the legacy fallback some browsers (notably older Safari)
            // use instead of setting it reliably.
            if (event.nativeEvent.isComposing || event.keyCode === 229) {
              return;
            }
            if (!enterToSendAllowed) return;
            event.preventDefault();
            if (canSend) onSend();
          }}
          placeholder={placeholder}
          disabled={disabled || sending}
          rows={1}
        />
        <button
          type="submit"
          className="rad-message-composer-send"
          disabled={!canSend}
          aria-label={sendLabel}
          aria-busy={sending || undefined}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 11.5 20.5 3 14 20.5l-3-7.5-8-1.5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </form>
      {error ? (
        <p className="rad-message-composer-error" role="alert">
          {error}
          {errorAction ? (
            <button type="button" onClick={errorAction.onClick}>
              {errorAction.label}
            </button>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
