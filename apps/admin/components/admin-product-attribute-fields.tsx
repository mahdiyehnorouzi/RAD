"use client";

import type { ProductAttribute, ProductAttributeValue } from "../lib/admin-data";
import { Field } from "./admin-dialog";

function fieldLabel(attribute: ProductAttribute) {
  const required = attribute.required ? " *" : "";
  const unit = attribute.unit ? ` (${attribute.unit})` : "";
  return `${attribute.label}${required}${unit}`;
}

function AttributeInput({
  attribute,
  value,
  onChange,
}: {
  attribute: ProductAttribute;
  value: ProductAttributeValue | undefined;
  onChange: (value: ProductAttributeValue | undefined) => void;
}) {
  switch (attribute.inputType) {
    case "number":
      return (
        <input
          dir="ltr"
          type="number"
          value={typeof value === "number" ? value : ""}
          onChange={(event) =>
            onChange(
              event.target.value === "" ? undefined : Number(event.target.value),
            )
          }
        />
      );
    case "boolean":
      return (
        <label className="attribute-switch">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(event) => onChange(event.target.checked)}
          />
          <span>{value === true ? "بله" : "خیر"}</span>
        </label>
      );
    case "select":
      return (
        <select
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value || undefined)}
        >
          <option value="">انتخاب کنید</option>
          {attribute.options.map((option) => (
            <option key={option.id} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    case "multiselect": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="attribute-option-list">
          {attribute.options.map((option) => (
            <label key={option.id} className="attribute-option">
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={(event) =>
                  onChange(
                    event.target.checked
                      ? [...selected, option.value]
                      : selected.filter((item) => item !== option.value),
                  )
                }
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      );
    }
    case "text":
    default:
      return (
        <input
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onChange(event.target.value || undefined)}
        />
      );
  }
}

/** Renders one input per attribute assigned to a product's category, inside the product form. */
export function ProductAttributeFields({
  attributes,
  loading,
  values,
  errors,
  onChange,
}: {
  attributes: ProductAttribute[];
  loading: boolean;
  values: Record<string, ProductAttributeValue>;
  errors: Record<string, string>;
  onChange: (attributeId: string, value: ProductAttributeValue | undefined) => void;
}) {
  if (loading) return <p>در حال بار گذاری ویژگی‌ها…</p>;
  if (!attributes.length)
    return (
      <p className="contact-message-empty">
        برای این دسته‌بندی ویژگی‌ای تعریف نشده است.
      </p>
    );
  return (
    <div className="form-grid">
      {attributes.map((attribute) => (
        <Field
          key={attribute.id}
          label={fieldLabel(attribute)}
          error={errors[attribute.id]}
        >
          <AttributeInput
            attribute={attribute}
            value={values[attribute.id]}
            onChange={(value) => onChange(attribute.id, value)}
          />
        </Field>
      ))}
    </div>
  );
}
