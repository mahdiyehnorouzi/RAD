"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import {
  attributeCategoryLabel,
  type ProductAttribute,
  type ProductAttributeInput,
} from "../lib/admin-data";
import { ConfirmDialog } from "./admin-dialog";
import { AdminRowActions, movedIds } from "./admin-row-actions";
import { AdminProductAttributeDialog } from "./admin-product-attribute-dialog";

const number = new Intl.NumberFormat("fa-IR");

const inputTypeLabels: Record<ProductAttribute["inputType"], string> = {
  text: "متن",
  number: "عدد",
  select: "تک‌انتخابی",
  multiselect: "چندانتخابی",
  boolean: "بولین (بله/خیر)",
};

/** Admin-managed product specs (رنگ، جنس، ارتفاع، …), assignable to categories. */
export function AdminProductAttributes({
  attributes,
  canWrite,
  onSave,
  onDelete,
  onReorder,
}: {
  attributes: ProductAttribute[];
  canWrite: boolean;
  onSave: (input: ProductAttributeInput, id?: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  onReorder: (ids: string[]) => Promise<void>;
}) {
  const [editing, setEditing] = useState<ProductAttribute | "new" | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProductAttribute | null>(
    null,
  );
  const [moving, setMoving] = useState(false);

  const move = async (from: number, to: number) => {
    setMoving(true);
    await onReorder(movedIds(attributes, from, to));
    setMoving(false);
  };

  return (
    <section className="paper-panel data-view">
      <div className="view-heading">
        <div>
          <h2>ویژگی‌های محصول</h2>
          <p>
            مشخصاتی مثل رنگ، جنس یا ابعاد که هنگام ساخت یا ویرایش یک اثر، بر
            اساس دسته‌بندی آن، در فرم محصول نشان داده می‌شوند و در صفحه‌ی محصول
            فروشگاه دیده می‌شوند.
          </p>
        </div>
        <button
          className="primary-action"
          type="button"
          onClick={() => setEditing("new")}
          disabled={!canWrite}
        >
          <Plus />
          ویژگی تازه
        </button>
      </div>

      {attributes.length ? (
        <ol className="contact-message-list content-list">
          {attributes.map((attribute, index) => (
            <li key={attribute.id} className="contact-message">
              <header>
                <div>
                  <strong>
                    {number.format(index + 1)}. {attribute.label}
                    {attribute.required ? " *" : ""}
                    {!attribute.active ? " (غیرفعال)" : ""}
                  </strong>
                  <small>
                    <bdi dir="ltr">{attribute.key}</bdi> ·{" "}
                    {inputTypeLabels[attribute.inputType]}
                    {attribute.unit ? ` · ${attribute.unit}` : ""}
                  </small>
                </div>
              </header>
              <p className="contact-message-body">
                دسته‌بندی‌ها:{" "}
                {attribute.categories.map(attributeCategoryLabel).join("، ") ||
                  "—"}
                {attribute.options.length
                  ? ` · گزینه‌ها: ${attribute.options
                      .map((option) => option.label)
                      .join("، ")}`
                  : ""}
              </p>
              {canWrite ? (
                <AdminRowActions
                  label={`ویژگی ${attribute.label}`}
                  index={index}
                  total={attributes.length}
                  disabled={moving}
                  onMove={(from, to) => void move(from, to)}
                  onEdit={() => setEditing(attribute)}
                  onDelete={() => setDeleteTarget(attribute)}
                />
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="contact-message-empty">
          هنوز ویژگی‌ای تعریف نشده است؛ فرم محصول بخش «ویژگی‌های محصول» را خالی
          نشان می‌دهد.
        </p>
      )}

      {editing && (
        <AdminProductAttributeDialog
          attribute={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (input) => {
            if (await onSave(input, editing === "new" ? undefined : editing.id))
              setEditing(null);
          }}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="حذف این ویژگی؟"
          description={`«${deleteTarget.label}» از فهرست ویژگی‌ها برداشته می‌شود. اگر این ویژگی برای محصولی ثبت شده باشد، حذف ممکن نیست و باید غیرفعال شود.`}
          confirmLabel="حذف ویژگی"
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            if (await onDelete(deleteTarget.id)) setDeleteTarget(null);
          }}
        />
      )}
    </section>
  );
}
