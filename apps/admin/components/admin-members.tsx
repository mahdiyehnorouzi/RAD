"use client";

import { useRef, useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import {
  roleLabels,
  type AdminMember,
  type AdminRole,
} from "../lib/admin-data";
import { createSingleFlight } from "../lib/admin-mutation";
import { AdminAsyncRegion } from "./admin-async-region";
import { DialogShell, Field } from "./admin-dialog";
import { EmptyState, StatusBadge } from "./admin-list-chrome";

export function Members({
  members,
  loading,
  loadError,
  refreshing = false,
  refreshError = false,
  onRetry,
  canWrite,
  onInvite,
  onChange,
}: {
  members: AdminMember[];
  loading: boolean;
  loadError: boolean;
  refreshing?: boolean;
  refreshError?: boolean;
  onRetry: () => void;
  canWrite: boolean;
  onInvite: () => void;
  onChange: (member: AdminMember) => void | Promise<void>;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState("");
  const roleFlight = useRef(createSingleFlight());

  const changeRole = (member: AdminMember) => {
    void roleFlight.current.run(async () => {
      setPendingId(member.id);
      setRowError("");
      try {
        await onChange(member);
      } catch (error) {
        setRowError(
          error instanceof Error && error.message
            ? error.message
            : "به‌روزرسانی دسترسی ناموفق بود. نقش قبلی سر جایش است.",
        );
      } finally {
        setPendingId(null);
      }
    });
  };

  return (
    <section className="paper-panel data-view">
      <div className="view-heading">
        <div>
          <span className="eyebrow">حریم کارگاه</span>
          <h2>افراد و دسترسی</h2>
          <p>دسترسی هر فرد را بر اساس مسئولیت واقعی او تنظیم کنید.</p>
        </div>
        <button
          className="primary-action"
          type="button"
          onClick={onInvite}
          disabled={!canWrite || loading || loadError}
        >
          <Plus />
          دعوت فرد جدید
        </button>
      </div>
      {rowError ? (
        <p className="admin-inline-error" role="alert">
          {rowError}
        </p>
      ) : null}
      <AdminAsyncRegion
        loading={loading}
        loadError={loadError}
        refreshing={refreshing}
        refreshError={refreshError}
        onRetry={onRetry}
        errorMessage="دریافت افراد و دسترسی ناموفق بود. اتصال اینترنت را بررسی و دوباره تلاش کنید."
        loadingLabel="در حال بارگذاری افراد…"
        skeleton="rows"
      >
        {members.length ? (
          <div className="member-list">
            {members.map((member) => (
              <article className="member-row" key={member.id}>
                <div className="member-avatar">{member.name.slice(0, 1)}</div>
                <div>
                  <strong>{member.name}</strong>
                  <small>{member.email}</small>
                  {pendingId === member.id ? (
                    <span className="admin-refresh" role="status">
                      در حال ذخیره…
                    </span>
                  ) : null}
                </div>
                <StatusBadge
                  label={member.status === "active" ? "فعال" : "دعوت‌شده"}
                  tone={member.status === "active" ? "green" : "muted"}
                />
                <select
                  value={member.role}
                  disabled={
                    !canWrite || member.role === "owner" || pendingId !== null
                  }
                  onChange={(event) =>
                    changeRole({
                      ...member,
                      role: event.target.value as AdminRole,
                    })
                  }
                  aria-label={`نقش ${member.name}`}
                >
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="هنوز فردی ثبت نشده"
            description="با دعوت، دسترسی کارگاه را برای یک نفر تازه باز کنید."
          />
        )}
      </AdminAsyncRegion>
      <div className="permission-note">
        <ShieldCheck />
        <div>
          <strong>مجوزها روی سرور بررسی می‌شوند</strong>
          <p>
            هر تغییر محصول، سفارش یا عضو از طریق API و نقش ذخیره‌شده در پایگاه
            داده کنترل می‌شود.
          </p>
        </div>
      </div>
    </section>
  );
}

export function InviteDialog({
  onClose,
  onInvite,
}: {
  onClose: () => void;
  onInvite: (member: AdminMember) => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("viewer");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const inviteFlight = useRef(createSingleFlight());
  return (
    <DialogShell
      title="دعوت فرد جدید"
      description="نقش را متناسب با مسئولیت فرد انتخاب کنید."
      onClose={onClose}
    >
      <form
        className="editor-form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (saving) return;
          if (!name.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
            setError("نام و ایمیل معتبر را وارد کنید.");
            return;
          }
          setError("");
          void inviteFlight.current.run(async () => {
            setSaving(true);
            try {
              await onInvite({
                id: crypto.randomUUID(),
                name,
                email,
                role,
                status: "invited",
              });
            } catch (caught) {
              setError(
                caught instanceof Error && caught.message
                  ? caught.message
                  : "دعوت ثبت نشد. نام و ایمیل سر جایشان است.",
              );
            } finally {
              setSaving(false);
            }
          });
        }}
      >
        <Field label="نام و نام خانوادگی">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </Field>
        <Field label="ایمیل" error={error}>
          <input
            dir="ltr"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(error)}
          />
        </Field>
        <Field label="سطح دسترسی">
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as AdminRole)}
          >
            {Object.entries(roleLabels)
              .filter(([value]) => value !== "owner")
              .map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
          </select>
        </Field>
        <div className="dialog-actions">
          <button className="secondary-action" type="button" onClick={onClose}>
            انصراف
          </button>
          <button className="primary-action" type="submit" disabled={saving}>
            {saving ? "در حال ثبت…" : "افزودن دعوت"}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}
