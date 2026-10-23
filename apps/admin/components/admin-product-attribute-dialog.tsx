"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  PRODUCT_ATTRIBUTE_INPUT_TYPES,
  PRODUCT_CATEGORY_LABELS,
  type ProductAttribute,
  type ProductAttributeInput,
  type ProductAttributeInputType,
  type ProductAttributeOptionInput,
} from "../lib/admin-data";
import { DialogShell, Field } from "./admin-dialog";

const inputTypeLabels: Record<ProductAttributeInputType, string> = {
  text: "متن",
  number: "عدد",
  select: "تک‌انتخابی",
  multiselect: "چندانتخابی",
  boolean: "بولین (بله/خیر)",
};

const blankOption = (): ProductAttributeOptionInput => ({
  value: "",
  label: "",
  sortOrder: 0,
});

function needsOptions(inputType: ProductAttributeInputType) {
  return inputType === "select" || inputType === "multiselect";
}

export function AdminProductAttributeDialog({
  attribute,
  onClose,
  onSave,
}: {
  attribute: ProductAttribute | null;
  onClose: () => void;
  onSave: (input: ProductAttributeInput) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ProductAttributeInput>(() =>
    attribute
      ? {
          key: attribute.key,
          label: attribute.label,
          inputType: attribute.inputType,
          unit: attribute.unit ?? "",
          required: attribute.required,
          active: attribute.active,
          sortOrder: attribute.sortOrder,
          categories: attribute.categories,
          options: attribute.options.map((option) => ({
            value: option.value,
            label: option.label,
            sortOrder: option.sortOrder,
          })),
        }
      : {
          key: "",
          label: "",
          inputType: "text",
          unit: "",
          required: false,
          active: true,
          sortOrder: 0,
          categories: [],
          options: [],
        },
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const setOptions = (change: (options: ProductAttributeOptionInput[]) => ProductAttributeOptionInput[]) =>
    setDraft((item) => ({ ...item, options: change(item.options) }));

  const toggleCategory = (label: string) =>
    setDraft((item) => ({
      ...item,
      categories: item.categories.includes(label)
        ? item.categories.filter((category) => category !== label)
        : [...item.categories, label],
    }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!draft.key.trim() || !/^[a-z0-9_-]+$/.test(draft.key.trim())) {
      setError("کلید ویژگی را فقط با حروف انگلیسی کوچک، عدد، خط فاصله یا زیرخط بنویسید.");
      return;
    }
    if (!draft.label.trim()) {
      setError("نام نمایشی ویژگی را وارد کنید.");
      return;
    }
    if (!draft.categories.length) {
      setError("دست‌کم یک دسته‌بندی برای این ویژگی انتخاب کنید.");
      return;
    }
    if (needsOptions(draft.inputType)) {
      const options = draft.options.filter((option) => option.value.trim() && option.label.trim());
      if (!options.length) {
        setError("ویژگی‌های تک‌انتخابی و چندانتخابی به دست‌کم یک گزینه نیاز دارند.");
        return;
      }
      const values = options.map((option) => option.value.trim());
      if (values.length !== new Set(values).size) {
        setError("کلید گزینه‌ها باید یکتا باشد.");
        return;
      }
    }
    setError("");
    setSaving(true);
    try {
      await onSave({
        ...draft,
        key: draft.key.trim(),
        label: draft.label.trim(),
        unit: draft.unit?.trim() || undefined,
        options: needsOptions(draft.inputType)
          ? draft.options
              .filter((option) => option.value.trim() && option.label.trim())
              .map((option, index) => ({
                value: option.value.trim(),
                label: option.label.trim(),
                sortOrder: index,
              }))
          : [],
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DialogShell
      title={attribute ? "ویرایش ویژگی" : "ویژگی تازه"}
      description="ویژگی‌ها در فرم ساخت یا ویرایش محصول، بر اساس دسته‌بندی انتخاب‌شده، نشان داده می‌شوند."
      onClose={onClose}
    >
      <form className="editor-form" onSubmit={submit} noValidate>
        <div className="form-grid">
          <Field label="نام نمایشی (مثل رنگ)">
            <input
              value={draft.label}
              onChange={(event) => setDraft({ ...draft, label: event.target.value })}
            />
          </Field>
          <Field label="کلید داخلی (مثل color)">
            <input
              dir="ltr"
              value={draft.key}
              readOnly={Boolean(attribute)}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  key: event.target.value.trim().toLowerCase(),
                })
              }
            />
          </Field>
          <Field label="نوع ورودی">
            <select
              value={draft.inputType}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  inputType: event.target.value as ProductAttributeInputType,
                })
              }
            >
              {PRODUCT_ATTRIBUTE_INPUT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {inputTypeLabels[type]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="واحد (اختیاری، مثل سانتی‌متر)">
            <input
              value={draft.unit ?? ""}
              onChange={(event) => setDraft({ ...draft, unit: event.target.value })}
            />
          </Field>
          <label className="attribute-switch">
            <input
              type="checkbox"
              checked={draft.required}
              onChange={(event) => setDraft({ ...draft, required: event.target.checked })}
            />
            <span>الزامی</span>
          </label>
          <label className="attribute-switch">
            <input
              type="checkbox"
              checked={draft.active}
              onChange={(event) => setDraft({ ...draft, active: event.target.checked })}
            />
            <span>فعال</span>
          </label>
        </div>

        <Field label="دسته‌بندی‌های مرتبط">
          <div className="attribute-categories">
            {PRODUCT_CATEGORY_LABELS.map((label) => (
              <label key={label}>
                <input
                  type="checkbox"
                  checked={draft.categories.includes(label)}
                  onChange={() => toggleCategory(label)}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </Field>

        {needsOptions(draft.inputType) && (
          <Field label="گزینه‌ها">
            <div className="attribute-option-editor">
              {draft.options.map((option, index) => (
                <div className="attribute-option-row" key={index}>
                  <input
                    placeholder="نام نمایشی (مثل سفید)"
                    value={option.label}
                    onChange={(event) =>
                      setOptions((options) =>
                        options.map((item, i) =>
                          i === index ? { ...item, label: event.target.value } : item,
                        ),
                      )
                    }
                  />
                  <input
                    dir="ltr"
                    placeholder="کلید (مثل white)"
                    value={option.value}
                    onChange={(event) =>
                      setOptions((options) =>
                        options.map((item, i) =>
                          i === index
                            ? { ...item, value: event.target.value.trim().toLowerCase() }
                            : item,
                        ),
                      )
                    }
                  />
                  <button
                    type="button"
                    className="secondary-action content-danger"
                    onClick={() =>
                      setOptions((options) => options.filter((_, i) => i !== index))
                    }
                    aria-label="حذف گزینه"
                  >
                    <Trash2 />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="secondary-action"
                onClick={() => setOptions((options) => [...options, blankOption()])}
              >
                <Plus /> افزودن گزینه
              </button>
            </div>
          </Field>
        )}

        {error && (
          <small className="field-error" role="alert">
            {error}
          </small>
        )}
        <div className="dialog-actions">
          <button className="secondary-action" type="button" onClick={onClose}>
            انصراف
          </button>
          <button className="primary-action" type="submit" disabled={saving}>
            ذخیره
          </button>
        </div>
      </form>
    </DialogShell>
  );
}
