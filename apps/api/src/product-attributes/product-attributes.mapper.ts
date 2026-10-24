import { BadRequestException } from "@nestjs/common";
import type {
  ProductAttribute,
  ProductAttributeCategory,
  ProductAttributeOption,
} from "../database/entities";
import type {
  ProductAttributeDisplayValue,
  ProductAttributeView,
} from "./type";

type FullAttribute = ProductAttribute & {
  options: ProductAttributeOption[];
  categoryLinks: ProductAttributeCategory[];
};

export function toProductAttributeView(
  attribute: FullAttribute,
): ProductAttributeView {
  return {
    id: attribute.id,
    key: attribute.key,
    label: attribute.label,
    inputType: attribute.inputType as ProductAttributeView["inputType"],
    unit: attribute.unit,
    required: attribute.required,
    active: attribute.active,
    sortOrder: attribute.sortOrder,
    // Raw store category values (see `SaveProductAttributeDto.categories`),
    // never run through `toAdminCategory` — the frontend owns mapping these
    // to Persian labels for display, since that mapping has nothing to do
    // with the admin's lossy product-category label system.
    categories: [...attribute.categoryLinks]
      .map((link) => link.category)
      .sort(),
    options: [...attribute.options]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((option) => ({
        id: option.id,
        value: option.value,
        label: option.label,
        sortOrder: option.sortOrder,
      })),
  };
}

const persianDigits = "۰۱۲۳۴۵۶۷۸۹";
function toPersianDigits(value: string) {
  return value.replace(/\d/g, (digit) => persianDigits[Number(digit)] ?? digit);
}

/**
 * Validates a raw admin-submitted value against the live attribute
 * definition and coerces it to the shape `ProductAttributeValue` stores.
 * Throws a `BadRequestException` with a Persian message on any mismatch —
 * the only place attribute values are validated before being persisted.
 */
export function coerceAttributeValue(
  attribute: FullAttribute,
  raw: unknown,
): string | number | boolean | string[] {
  const label = attribute.label;
  switch (attribute.inputType) {
    case "text": {
      if (typeof raw !== "string" || !raw.trim())
        throw new BadRequestException(`مقدار «${label}» نامعتبر است.`);
      return raw.trim();
    }
    case "number": {
      const value = typeof raw === "string" ? Number(raw) : raw;
      if (typeof value !== "number" || !Number.isFinite(value))
        throw new BadRequestException(`مقدار «${label}» باید عدد باشد.`);
      return value;
    }
    case "boolean": {
      if (typeof raw !== "boolean")
        throw new BadRequestException(
          `مقدار «${label}» باید درست یا نادرست باشد.`,
        );
      return raw;
    }
    case "select": {
      if (typeof raw !== "string")
        throw new BadRequestException(`مقدار «${label}» نامعتبر است.`);
      if (!attribute.options.some((option) => option.value === raw))
        throw new BadRequestException(
          `مقدار انتخاب‌شده برای «${label}» از گزینه‌های تعریف‌شده نیست.`,
        );
      return raw;
    }
    case "multiselect": {
      if (!Array.isArray(raw) || !raw.every((item) => typeof item === "string"))
        throw new BadRequestException(`مقدار «${label}» نامعتبر است.`);
      const values = [...new Set(raw)];
      const allowed = new Set(attribute.options.map((option) => option.value));
      if (!values.every((value) => allowed.has(value)))
        throw new BadRequestException(
          `مقدار انتخاب‌شده برای «${label}» از گزینه‌های تعریف‌شده نیست.`,
        );
      return values;
    }
    default:
      throw new BadRequestException(`نوع ویژگی «${label}» نامعتبر است.`);
  }
}

/** Renders a stored value for display (storefront + admin read paths). */
export function formatAttributeDisplayValue(
  attribute: FullAttribute,
  value: unknown,
): ProductAttributeDisplayValue | null {
  const unitSuffix = attribute.unit ? ` ${attribute.unit}` : "";
  switch (attribute.inputType) {
    case "boolean": {
      if (typeof value !== "boolean") return null;
      return {
        key: attribute.key,
        label: attribute.label,
        value: value ? "بله" : "خیر",
      };
    }
    case "number": {
      if (typeof value !== "number" || !Number.isFinite(value)) return null;
      return {
        key: attribute.key,
        label: attribute.label,
        value: `${toPersianDigits(String(value))}${unitSuffix}`,
      };
    }
    case "select": {
      if (typeof value !== "string" || !value) return null;
      const option = attribute.options.find((item) => item.value === value);
      return {
        key: attribute.key,
        label: attribute.label,
        value: option?.label ?? value,
      };
    }
    case "multiselect": {
      if (!Array.isArray(value) || !value.length) return null;
      const labels = value.map(
        (item) =>
          attribute.options.find((option) => option.value === item)?.label ??
          String(item),
      );
      return {
        key: attribute.key,
        label: attribute.label,
        value: labels.join("، "),
      };
    }
    case "text":
    default: {
      if (typeof value !== "string" || !value.trim()) return null;
      return {
        key: attribute.key,
        label: attribute.label,
        value: `${value}${unitSuffix}`,
      };
    }
  }
}
