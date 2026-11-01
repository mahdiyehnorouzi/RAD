"use client";
import "./checkout-page.css";
import "../flow/purchase-design.css";

import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  CART_HOLD_MINUTES,
  ORDER_PAYMENT_WINDOW_MINUTES,
  ORDER_POLICY_SLUGS,
  currentPolicyVersions,
  type Product,
} from "@rad/types";
import { CartEmpty, useCart } from "@/features/cart";
import { useCatalog } from "@/components/catalog";
import { useCommerce } from "@/components/commerce";
import { HelpPanel } from "@/components/contact";
// Imported from its own sub-path, not the `@/components/help` barrel —
// that barrel also reaches help-hub/policy-page, which this client
// component (checkout) has no use for.
import { CheckoutAgreement } from "@/components/help/purchase-path";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { useCountdown } from "@/hooks/use-countdown";
import { ApiError, isNetworkError, readableErrorMessage } from "@/lib/api";
import { availableWorks, formatCountdown } from "@/lib/catalog/product-status";
import { productCopy } from "@/lib/catalog/products";
import { cartTotal, formatTotal } from "@/lib/money";
import {
  cityAfterProvinceChange,
  locationSelection,
  restoreCheckoutLocation,
} from "@/lib/geo/iran-locations";
import {
  applyIranMobileEdit,
  canonicalIranMobile,
  formatIranMobileDraft,
  iranMobileMessage,
} from "@/lib/phone/iran-mobile";
import { seedCheckoutName, seedCheckoutPhone } from "./checkout-contact";
import { toLatinDigits } from "@/lib/payment/receipt";
import { checkoutCopy, fillCopy } from "../const";
import { CheckoutMeter, CheckoutSteps, CheckoutSummary } from "../flow";
import { CheckoutField } from "./checkout-field";
import { LocationFields } from "./location-fields";

type FieldName = "name" | "phone" | "province" | "city" | "address";
type FieldErrors = Partial<Record<FieldName, string>>;

/** Backend codes meaning the cart/hold this form was built from no longer matches reality. */
const CART_STALE_CODES = new Set([
  "cart_empty",
  "cart_items_unavailable",
  "cart_item_unavailable",
  "cart_item_price_missing",
]);

const FORM_ID = "checkout-details";
const FIELD_ORDER: FieldName[] = [
  "name",
  "phone",
  "province",
  "city",
  "address",
];
const DRAFT_KEY = "rad.checkout.draft";
type Draft = Partial<
  Record<
    | "name"
    | "phone"
    | "provinceId"
    | "cityId"
    | "city"
    | "address"
    | "postalCode",
    string
  >
>;

/**
 * Inputs below are uncontrolled (`defaultValue`), so a browser back
 * navigation from `/checkout/[id]` (payment) to `/checkout` fully remounts
 * this form and would otherwise lose everything the buyer typed. Persist a
 * draft to sessionStorage and seed `defaultValue` from it.
 */
function readDraft(): Draft {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : {};
  } catch {
    return {};
  }
}

function writeDraft(draft: Draft) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {}
}

function clearDraft() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {}
}

export function CheckoutPage() {
  const { slugs, holds, holdEndsAt, ready, clear, reload } = useCart();
  const { user, placeOrder } = useCommerce();
  const { products, getProduct, refresh: refreshCatalog } = useCatalog();
  const { locale, href, number } = useLocale();
  const c = checkoutCopy[locale];
  const router = useRouter();

  const [errors, setErrors] = useState<FieldErrors>({});
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [agreeMissing, setAgreeMissing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const phoneCaret = useRef<number | null>(null);
  const agreeRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const items = slugs
    .map((slug) => getProduct(slug))
    .filter((item): item is Product => Boolean(item));
  const formVisible = !leaving && ready && slugs.length > 0 && items.length > 0;
  const total = formatTotal(cartTotal(items), locale);
  const lost = slugs.some((slug) => !holds[slug] || !getProduct(slug));
  const remaining = useCountdown(holdEndsAt);
  const ArrowIcon = locale === "fa" ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (!error) return;
    errorRef.current?.focus();
  }, [error]);

  // The bag is not ready on the first render, so the form is not mounted
  // yet. Restore only once it is actually in the document — including a
  // later visit via browser back — without waiting on a one-shot mount effect.
  useLayoutEffect(() => {
    if (!formVisible) return;
    const form = formRef.current;
    if (!form) return;
    const draft = readDraft();
    for (const name of ["address", "postalCode"] as const) {
      const value = draft[name];
      if (!value) continue;
      const field = form.elements.namedItem(name);
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLTextAreaElement
      ) {
        field.value = value;
      }
    }
    const nameField = form.elements.namedItem("name");
    if (nameField instanceof HTMLInputElement) {
      nameField.value = seedCheckoutName({
        current: nameField.value,
        draftName: draft.name,
        profileName: user?.name,
      });
    }
    const location = restoreCheckoutLocation(draft);
    // Session storage is read after mount so the server render stays empty.
    setProvinceId(location.provinceId);
    setCityId(location.cityId);
    setPhone((current) =>
      seedCheckoutPhone({
        current,
        draftPhone: draft.phone,
        profilePhone: user?.phone,
      }),
    );
  }, [formVisible, user?.name, user?.phone]);

  useLayoutEffect(() => {
    const node = phoneRef.current;
    const caret = phoneCaret.current;
    if (!node || caret == null) return;
    node.setSelectionRange(caret, caret);
    phoneCaret.current = null;
  }, [phone]);

  const persistDraft = (patch?: Partial<Draft>) => {
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    writeDraft({
      name: String(data.get("name") ?? ""),
      phone,
      provinceId,
      cityId,
      address: String(data.get("address") ?? ""),
      postalCode: String(data.get("postalCode") ?? ""),
      ...patch,
    });
  };

  const phoneCopy = { empty: c.phoneEmpty, invalid: c.phoneError };

  const validate = (data: FormData): FieldErrors => {
    const value = (key: "name" | "address") =>
      String(data.get(key) ?? "").trim();
    const next: FieldErrors = {};
    if (value("name").length < 2) next.name = c.nameError;
    const phoneError = iranMobileMessage(phone, true, phoneCopy);
    if (phoneError) next.phone = phoneError;
    const place = locationSelection(provinceId, cityId);
    if (!place.ok) {
      if (place.reason === "province") next.province = c.provinceError;
      else next.city = c.cityError;
    }
    if (value("address").length < 8) next.address = c.addressError;
    return next;
  };

  const clearFieldError = (name: FieldName) =>
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });

  const setFieldError = (name: FieldName, message?: string) =>
    setErrors((current) => {
      if (!message) {
        if (!current[name]) return current;
        const next = { ...current };
        delete next[name];
        return next;
      }
      if (current[name] === message) return current;
      return { ...current, [name]: message };
    });

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || leaving) return;
    const data = new FormData(event.currentTarget);
    setPhoneTouched(true);
    const nextErrors = validate(data);
    setErrors(nextErrors);
    const firstInvalid = FIELD_ORDER.find((name) => nextErrors[name]);
    if (firstInvalid) {
      formRef.current
        ?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)
        ?.focus();
      return;
    }
    if (!accepted) {
      setAgreeMissing(true);
      agreeRef.current?.focus();
      return;
    }

    const field = (key: string) => String(data.get(key) ?? "").trim();
    const postalCode = toLatinDigits(field("postalCode"));
    const mobile = canonicalIranMobile(phone);
    const place = locationSelection(provinceId, cityId);
    if (!mobile || !place.ok) return;
    try {
      setError("");
      setSubmitting(true);
      const created = await placeOrder({
        name: field("name"),
        phone: mobile,
        city: place.snapshot,
        address: [
          field("address"),
          postalCode && `${c.postalLabel} ${postalCode}`,
        ]
          .filter(Boolean)
          .join(locale === "fa" ? "، " : ", "),
        acceptedPolicies: currentPolicyVersions(ORDER_POLICY_SLUGS),
      });
      setLeaving(true);
      clearDraft();
      // Always land on the Review & Payment screen next — even for a
      // gateway order, which already has a live redirectUrl at this point.
      // Jumping straight to the external gateway from here would skip the
      // approved "review your order, then pay" step entirely; checkout-
      // payment.tsx is what actually shows the summary and the "پرداخت و
      // تکمیل خرید" button that starts the real redirect.
      router.push(href(`/checkout/${encodeURIComponent(created.id)}`));
      void clear().catch(() => {});
    } catch (err) {
      if (
        err instanceof ApiError &&
        err.code &&
        CART_STALE_CODES.has(err.code)
      ) {
        // The hold or cart row the form was built from is already gone
        // server-side (expired, claimed by someone else, or swept by a
        // concurrent request) — resync local state so the existing "lost"
        // panel (holdGone + back-to-bag) renders instead of leaving the
        // stale order summary next to a contradictory raw error string.
        void reload();
        void refreshCatalog();
      } else {
        setError(
          isNetworkError(err)
            ? c.networkFailed
            : readableErrorMessage(err, c.requestFailed),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (leaving) {
    return (
      <section className="checkout-flow section" aria-busy="true">
        <CheckoutSteps current={2} />
        <p className="checkout-flow-leaving" role="status">
          {c.leaving}
        </p>
      </section>
    );
  }

  if (!ready) {
    return (
      <section className="checkout-flow section" aria-busy="true">
        <CheckoutSteps current={1} />
        <CardListSkeleton count={2} />
      </section>
    );
  }

  if (!slugs.length) {
    return <CartEmpty suggestions={availableWorks(products)} />;
  }

  if (!items.length) {
    return (
      <section className="checkout-flow section">
        <CheckoutSteps current={1} />
        <div className="checkout-alert" role="alert">
          <p>{c.holdGone}</p>
          <ButtonLink href="/cart" outline>
            {c.backToBag}
          </ButtonLink>
        </div>
      </section>
    );
  }

  const busy = submitting;
  const fieldProps = (name: FieldName) => ({
    id: `checkout-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `checkout-${name}-error` : undefined,
    onInput: () => {
      clearFieldError(name);
      persistDraft();
    },
    disabled: busy,
  });

  return (
    <section className="checkout-flow section">
      <CheckoutSteps current={1} />
      <header className="checkout-flow-head">
        <h1>{c.detailsTitle}</h1>
        <p>{c.detailsLede}</p>
      </header>

      <div className="checkout-flow-body">
        <form
          id={FORM_ID}
          ref={formRef}
          className="checkout-flow-main checkout-details"
          onSubmit={submit}
          noValidate
        >
          <CheckoutField
            id="checkout-name"
            label={c.nameLabel}
            error={errors.name}
          >
            <input
              {...fieldProps("name")}
              type="text"
              defaultValue={user?.name ?? ""}
              autoComplete="name"
            />
          </CheckoutField>
          <CheckoutField
            id="checkout-phone"
            label={c.phoneLabel}
            error={errors.phone}
          >
            <input
              ref={phoneRef}
              id="checkout-phone"
              name="phone"
              className="checkout-ltr-field"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              dir="ltr"
              placeholder={c.phonePlaceholder}
              value={phone}
              disabled={busy}
              aria-invalid={errors.phone ? true : undefined}
              aria-describedby={
                errors.phone ? "checkout-phone-error" : undefined
              }
              onChange={(event) => {
                const cursor =
                  event.currentTarget.selectionStart ??
                  event.currentTarget.value.length;
                const edit = applyIranMobileEdit(
                  phone,
                  event.currentTarget.value,
                  cursor,
                );
                phoneCaret.current = edit.cursor;
                if (edit.value === phone) {
                  event.currentTarget.value = edit.value;
                  event.currentTarget.setSelectionRange(
                    edit.cursor,
                    edit.cursor,
                  );
                  phoneCaret.current = null;
                }
                setPhone(edit.value);
                if (phoneTouched) {
                  setFieldError(
                    "phone",
                    iranMobileMessage(edit.value, true, phoneCopy),
                  );
                } else {
                  clearFieldError("phone");
                }
                persistDraft({ phone: edit.value });
              }}
              onBlur={() => {
                setPhoneTouched(true);
                const canonical = canonicalIranMobile(phone);
                const next = canonical
                  ? formatIranMobileDraft(canonical)
                  : phone;
                if (canonical) setPhone(next);
                setFieldError(
                  "phone",
                  iranMobileMessage(next, true, phoneCopy),
                );
                persistDraft({ phone: next });
              }}
            />
          </CheckoutField>
          <LocationFields
            provinceId={provinceId}
            cityId={cityId}
            provinceLabel={c.provinceLabel}
            cityLabel={c.cityLabel}
            provincePlaceholder={c.provincePlaceholder}
            cityPlaceholder={c.cityPlaceholder}
            cityWaiting={c.cityWaiting}
            provinceError={errors.province}
            cityError={errors.city}
            disabled={busy}
            onProvince={(next) => {
              const city = cityAfterProvinceChange(provinceId, next, cityId);
              setProvinceId(next);
              setCityId(city);
              setFieldError("province", next ? undefined : c.provinceError);
              if (city !== cityId) clearFieldError("city");
              persistDraft({ provinceId: next, cityId: city });
            }}
            onCity={(next) => {
              setCityId(next);
              setFieldError("city", next ? undefined : c.cityError);
              persistDraft({ cityId: next });
            }}
            onProvinceBlur={(value) => {
              setFieldError("province", value ? undefined : c.provinceError);
            }}
            onCityBlur={(value) => {
              if (!provinceId) return;
              setFieldError("city", value ? undefined : c.cityError);
            }}
          />
          <CheckoutField
            id="checkout-address"
            label={c.addressLabel}
            error={errors.address}
            wide
          >
            <textarea
              {...fieldProps("address")}
              className="resize-none"
              rows={3}
              autoComplete="street-address"
              placeholder={c.addressPlaceholder}
            />
          </CheckoutField>
          <CheckoutField
            id="checkout-postal"
            label={c.postalLabel}
            optional={c.optional}
          >
            <input
              id="checkout-postal"
              name="postalCode"
              className="checkout-ltr-field"
              type="text"
              inputMode="numeric"
              autoComplete="postal-code"
              dir="ltr"
              disabled={busy}
              onInput={() => persistDraft()}
            />
          </CheckoutField>
        </form>

        <aside className="checkout-flow-aside">
          <CheckoutSummary items={items} total={total} />
        </aside>

        <div className="checkout-flow-action">
          {lost ? (
            <div className="checkout-alert" role="alert">
              <p>{c.holdGone}</p>
              <ButtonLink href="/cart" outline>
                {c.backToBag}
              </ButtonLink>
            </div>
          ) : remaining !== null ? (
            <CheckoutMeter
              title={c.holdTitle}
              time={formatCountdown(remaining, locale, number)}
              fraction={remaining / (CART_HOLD_MINUTES * 60_000)}
            >
              {c.holdBody ? `${c.holdBody} ` : ""}
              {fillCopy(c.holdAfter, {
                minutes: number(ORDER_PAYMENT_WINDOW_MINUTES),
              })}
            </CheckoutMeter>
          ) : null}

          <CheckoutAgreement
            ref={agreeRef}
            checked={accepted}
            invalid={agreeMissing}
            onChange={(checked) => {
              setAccepted(checked);
              if (checked) setAgreeMissing(false);
            }}
          />

          {error ? (
            <p
              ref={errorRef}
              className="checkout-alert"
              role="alert"
              tabIndex={-1}
            >
              {error}
            </p>
          ) : Object.keys(errors).length ? (
            <p className="checkout-alert" role="status">
              {c.fixFields}
            </p>
          ) : null}

          <button
            type="submit"
            form={FORM_ID}
            className="checkout-submit"
            disabled={busy || lost}
            aria-busy={busy || undefined}
          >
            <span>{submitting ? c.submitting : c.submit}</span>
            <ArrowIcon aria-hidden="true" />
          </button>
        </div>

        <div className="checkout-flow-help">
          <HelpPanel
            context="checkout"
            subject={items
              .map((product) => productCopy(product, locale).name)
              .join(locale === "fa" ? "، " : ", ")}
          />
        </div>
      </div>
    </section>
  );
}
