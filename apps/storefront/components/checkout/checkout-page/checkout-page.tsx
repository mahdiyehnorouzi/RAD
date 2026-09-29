"use client";
import "./checkout-page.css";

import { FormEvent, useEffect, useRef, useState } from "react";
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
import { CheckoutAgreement } from "@/components/help";
import { useLocale } from "@/components/i18n";
import { ButtonLink } from "@/components/ui/button-link";
import { CardListSkeleton } from "@/components/ui/skeleton";
import { useCountdown } from "@/hooks/use-countdown";
import { isNetworkError, readableErrorMessage } from "@/lib/api";
import { availableWorks, formatCountdown } from "@/lib/catalog/product-status";
import { productCopy } from "@/lib/catalog/products";
import { cartTotal, formatTotal } from "@/lib/money";
import { toLatinDigits } from "@/lib/payment/receipt";
import { checkoutCopy, fillCopy } from "../const";
import { CheckoutMeter, CheckoutSteps, CheckoutSummary } from "../flow";
import { CheckoutField } from "./checkout-field";

type FieldName = "name" | "phone" | "city" | "address";
type FieldErrors = Partial<Record<FieldName, string>>;

const FORM_ID = "checkout-details";
const FIELD_ORDER: FieldName[] = ["name", "phone", "city", "address"];

function normalizePhone(raw: string) {
  return toLatinDigits(raw).replace(/[^\d+]/g, "");
}

export function CheckoutPage() {
  const { slugs, holds, holdEndsAt, ready, clear } = useCart();
  const { user, placeOrder } = useCommerce();
  const { products, getProduct } = useCatalog();
  const { locale, href, number } = useLocale();
  const c = checkoutCopy[locale];
  const router = useRouter();

  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [agreeMissing, setAgreeMissing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const agreeRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const items = slugs
    .map((slug) => getProduct(slug))
    .filter((item): item is Product => Boolean(item));
  const total = formatTotal(cartTotal(items, locale), locale);
  const lost = slugs.some((slug) => !holds[slug] || !getProduct(slug));
  const remaining = useCountdown(holdEndsAt);
  const ArrowIcon = locale === "fa" ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (!error) return;
    errorRef.current?.focus();
  }, [error]);

  const validate = (data: FormData): FieldErrors => {
    const value = (key: FieldName) => String(data.get(key) ?? "").trim();
    const next: FieldErrors = {};
    if (value("name").length < 2) next.name = c.nameError;
    const phoneDigits = normalizePhone(value("phone")).replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15)
      next.phone = c.phoneError;
    if (!value("city")) next.city = c.cityError;
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

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || leaving) return;
    const data = new FormData(event.currentTarget);
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
    try {
      setError("");
      setSubmitting(true);
      const created = await placeOrder({
        name: field("name"),
        phone: normalizePhone(field("phone")),
        city: field("city"),
        address: [
          field("address"),
          postalCode && `${c.postalLabel} ${postalCode}`,
        ]
          .filter(Boolean)
          .join(locale === "fa" ? "، " : ", "),
        acceptedPolicies: currentPolicyVersions(ORDER_POLICY_SLUGS),
      });
      setLeaving(true);
      if (created.payment?.redirectUrl) {
        window.location.assign(created.payment.redirectUrl);
        return;
      }
      router.push(href(`/checkout/${encodeURIComponent(created.id)}`));
      void clear().catch(() => {});
    } catch (err) {
      setError(
        isNetworkError(err)
          ? c.networkFailed
          : readableErrorMessage(err, c.requestFailed),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (leaving) {
    return (
      <section className="checkout-flow section" aria-busy="true">
        <CheckoutSteps current={1} />
        <p className="checkout-flow-leaving" role="status">
          {c.leaving}
        </p>
      </section>
    );
  }

  if (!ready) {
    return (
      <section className="checkout-flow section" aria-busy="true">
        <CheckoutSteps current={0} />
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
        <CheckoutSteps current={0} />
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
    onInput: () => clearFieldError(name),
    disabled: busy,
  });

  return (
    <section className="checkout-flow section">
      <CheckoutSteps current={0} />
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
              {...fieldProps("phone")}
              className="checkout-ltr-field"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              placeholder={c.phonePlaceholder}
            />
          </CheckoutField>
          <CheckoutField
            id="checkout-city"
            label={c.cityLabel}
            error={errors.city}
          >
            <input
              {...fieldProps("city")}
              type="text"
              autoComplete="address-level2"
            />
          </CheckoutField>
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
              {c.holdBody}{" "}
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
