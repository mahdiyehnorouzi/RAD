"use client";

import { X } from "lucide-react";

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
