"use client";

import { useState } from "react";
import type { AdminCategory } from "@rad/types";
import { Button } from "@rad/ui";
import { DialogShell, Field } from "../../components/admin-dialog";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type CategoryInput = {
  slug: string;
  name: { fa: string; en: string };
  sortOrder: number;
  active: boolean;
  parentId: string | null;
};

export function AdminCategoryDialog({
  category,
  parents,
  initialParentId = null,
  onClose,
  onSave,
}: {
  category: AdminCategory | null;
  parents: AdminCategory[];
  initialParentId?: string | null;
  onClose: () => void;
  onSave: (input: CategoryInput) => Promise<void>;
}) {
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [nameFa, setNameFa] = useState(category?.name.fa ?? "");
  const [nameEn, setNameEn] = useState(category?.name.en ?? "");
  const [sortOrder, setSortOrder] = useState(
    category ? String(category.sortOrder) : "",
  );
  const [active, setActive] = useState(category?.active ?? true);
  const [parentId, setParentId] = useState<string | null>(
    category?.parentId ?? initialParentId,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const lockedParent = Boolean(category && category.children.length > 0);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    const nextSlug = slug.trim().toLowerCase();
    if (!SLUG.test(nextSlug)) {
      nextErrors.slug = "شناسه فقط حروف انگلیسی کوچک، عدد و خط تیره می‌پذیرد.";
    }
    if (!nameFa.trim()) nextErrors.nameFa = "نام فارسی لازم است.";
    if (!nameEn.trim()) nextErrors.nameEn = "نام انگلیسی لازم است.";
    const order =
      sortOrder.trim() === "" ? (category?.sortOrder ?? 0) : Number(sortOrder);
    if (!Number.isInteger(order) || order < 0) {
      nextErrors.sortOrder = "ترتیب باید یک عدد صفر یا بزرگ‌تر باشد.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setSaving(true);
    setFormError("");
    void onSave({
      slug: nextSlug,
      name: { fa: nameFa.trim(), en: nameEn.trim() },
      sortOrder: order,
      active,
      parentId: lockedParent ? null : parentId,
    })
      .catch((error: unknown) => {
        setFormError(
          error instanceof Error && error.message
            ? error.message
            : "ذخیره دسته‌بندی ناموفق بود.",
        );
      })
      .finally(() => setSaving(false));
  };

  return (
    <DialogShell
      title={category ? "ویرایش دسته‌بندی" : "دسته‌بندی تازه"}
      description="هر دسته یک نام فارسی و یک نام انگلیسی دارد. زیردسته فقط زیر یک دستهٔ اصلی می‌نشیند."
      onClose={onClose}
    >
      <form className="editor-form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <Field label="نام فارسی" error={errors.nameFa}>
            <input
              value={nameFa}
              onChange={(event) => setNameFa(event.target.value)}
              aria-invalid={Boolean(errors.nameFa)}
            />
          </Field>
          <Field label="نام انگلیسی" error={errors.nameEn}>
            <input
              dir="ltr"
              value={nameEn}
              onChange={(event) => setNameEn(event.target.value)}
              aria-invalid={Boolean(errors.nameEn)}
            />
          </Field>
          <Field
            label="شناسه"
            hint="در نشانی فروشگاه استفاده می‌شود و بعد از اتصال به اثر عوض نمی‌شود."
            error={errors.slug}
          >
            <input
              dir="ltr"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
              aria-invalid={Boolean(errors.slug)}
            />
          </Field>
          <Field
            label="دستهٔ والد"
            hint="خالی یعنی این ردیف خودش دستهٔ اصلی است."
          >
            <select
              value={parentId ?? ""}
              disabled={lockedParent}
              onChange={(event) => setParentId(event.target.value || null)}
            >
              <option value="">دستهٔ اصلی</option>
              {parents
                .filter((parent) => parent.id !== category?.id)
                .map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.name.fa}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="ترتیب نمایش" error={errors.sortOrder}>
            <input
              dir="ltr"
              inputMode="numeric"
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
              aria-invalid={Boolean(errors.sortOrder)}
            />
          </Field>
          <Field label="وضعیت">
            <select
              value={active ? "active" : "inactive"}
              onChange={(event) => setActive(event.target.value === "active")}
            >
              <option value="active">فعال</option>
              <option value="inactive">غیرفعال</option>
            </select>
          </Field>
        </div>
        {formError ? (
          <p className="admin-inline-error" role="alert">
            {formError}
          </p>
        ) : null}
        <div className="dialog-actions">
          <Button variant="secondary" type="button" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" loading={saving}>
            ذخیره
          </Button>
        </div>
      </form>
    </DialogShell>
  );
}
