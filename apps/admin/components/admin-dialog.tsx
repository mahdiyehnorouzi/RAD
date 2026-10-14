"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

// Ref-counted so a second overlay opening on top of a first — or one
// closing while another is still open — never unlocks the background: the
// lock only lifts once every mounted caller has released it. Scroll
// position is saved/restored explicitly (rather than relying on
// `position:fixed` alone) because iOS Safari can still rubber-band the
// background page behind a merely-fixed element otherwise.
let lockCount = 0;
let savedScrollY = 0;

export function useBodyScrollLock(active = true) {
  useEffect(() => {
    if (!active) return;
    if (lockCount === 0) {
      savedScrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.insetInlineStart = "0";
      document.body.style.insetInlineEnd = "0";
      document.body.style.overflow = "hidden";
    }
    lockCount += 1;
    return () => {
      lockCount -= 1;
      if (lockCount === 0) {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.insetInlineStart = "";
        document.body.style.insetInlineEnd = "";
        document.body.style.overflow = "";
        window.scrollTo(0, savedScrollY);
      }
    };
  }, [active]);
}

/** True below the admin's mobile breakpoint; updates live on resize. */
export function useIsMobileViewport(breakpoint = 760) {
  const query = `(max-width: ${breakpoint}px)`;
  const getMatch = () =>
    typeof window !== "undefined" ? window.matchMedia(query).matches : false;
  const [matches, setMatches] = useState(getMatch);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakpoint]);
  return matches;
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "حذف محصول",
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <DialogShell
      title={title}
      description={description}
      onClose={onCancel}
      compact
    >
      <div className="dialog-actions">
        <button className="secondary-action" type="button" onClick={onCancel}>
          انصراف
        </button>
        <button className="danger-action" type="button" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </DialogShell>
  );
}

export function DialogShell({
  title,
  description,
  onClose,
  children,
  compact = false,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
  compact?: boolean;
}) {
  useBodyScrollLock();
  return (
    <div
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`dialog ${compact ? "compact" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby="dialog-description"
      >
        <header>
          <div>
            <span className="eyebrow">دفتر رَد</span>
            <h2 id="dialog-title">{title}</h2>
            <p id="dialog-description">{description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="بستن">
            <X />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && (
        <small className="field-error" role="alert">
          {error}
        </small>
      )}
    </label>
  );
}
