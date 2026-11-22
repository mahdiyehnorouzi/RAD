"use client";
import "./checkout-page.css";
import "../flow/purchase-design.css";

import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Truck, UserRound } from "lucide-react";
import {
  CART_HOLD_MINUTES,
  ORDER_PAYMENT_WINDOW_MINUTES,
  EXPRESS_POST_FEE_TOMAN,
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
import {
  addressChoiceOf,
  defaultAddressToApply,
  deliveryFromSaved,
  emptyDeliveryFields,
  orderAddressSnapshot,
  orderCitySnapshot,
  sameDelivery,
  savedAddressIdOf,
  validPostalOrEmpty,
  type CheckoutDraft,
  type DeliveryFields,
} from "./checkout-delivery";
import { SavedAddressPicker } from "./saved-address-picker";
import { useCheckoutAddresses } from "./use-checkout-addresses";
import { checkoutCopy, fillCopy } from "../const";
import { CheckoutMeter, CheckoutSteps, CheckoutSummary } from "../flow";
import type { CheckoutStepId } from "../flow/checkout-steps";
import { CheckoutAccountOffer } from "./checkout-account-offer";
import { CheckoutField } from "./checkout-field";
import { LocationFields } from "./location-fields";
import {
  expressPostFeeToman,
  normalizeShippingMethod,
} from "./checkout-shipping";
import { ShippingOptions } from "./shipping-options";

type FieldName =
  | "recipientName"
  | "recipientPhone"
  | "name"
  | "phone"
  | "province"
  | "city"
  | "address"
  | "postalCode";
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
  "recipientName",
  "recipientPhone",
  "province",
  "city",
  "address",
  "postalCode",
];
const DRAFT_KEY = "rad.checkout.draft";
type Draft = CheckoutDraft;

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

function writeControls(form: HTMLFormElement, fields: DeliveryFields) {
  for (const name of ["name", "address", "postalCode"] as const) {
    const field = form.elements.namedItem(name);
    if (
      field instanceof HTMLInputElement ||
      field instanceof HTMLTextAreaElement
    ) {
      field.value = fields[name];
    }
  }
}

function readControl(
  form: HTMLFormElement,
  name: "name" | "address" | "postalCode",
) {
  const field = form.elements.namedItem(name);
  if (
    field instanceof HTMLInputElement ||
    field instanceof HTMLTextAreaElement
  ) {
    return field.value;
  }
  return "";
}

export function CheckoutPage() {
  const { slugs, holds, holdEndsAt, ready, reload } = useCart();
  const { user, placeOrder, ready: sessionReady } = useCommerce();
  const { products, getProduct, refresh: refreshCatalog } = useCatalog();
  const { locale, href, number } = useLocale();
  const c = checkoutCopy[locale];
  const router = useRouter();
  const signedIn = sessionReady && Boolean(user);
  const {
    status: addressStatus,
    addresses: savedAddresses,
    retry: retryAddresses,
  } = useCheckoutAddresses(signedIn ? (user?.id ?? "") : "");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [provinceId, setProvinceId] = useState("");
  const [cityId, setCityId] = useState("");
  const [fields, setFields] = useState<DeliveryFields>(emptyDeliveryFields);
  const [addressChoice, setAddressChoice] = useState<"" | "saved" | "manual">(
    "",
  );
  const [savedAddressId, setSavedAddressId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [agreeMissing, setAgreeMissing] = useState(false);
  const [panel, setPanel] = useState<"contact" | "delivery">("contact");
  const [alternateRecipient, setAlternateRecipient] = useState(false);
  const [shippingMethod, setShippingMethod] = useState<
    "express" | "courier" | ""
  >("");
  const panelRef = useRef(panel);
  panelRef.current = panel;
  const formRef = useRef<HTMLFormElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const phoneCaret = useRef<number | null>(null);
  const agreeRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);

  const items = slugs
    .map((slug) => getProduct(slug))
    .filter((item): item is Product => Boolean(item));
  const formVisible = !leaving && ready && slugs.length > 0 && items.length > 0;
  const itemsAmount = cartTotal(items);
  const shippingFee = shippingMethod === "express" ? expressPostFeeToman() : 0;
  const itemsTotal = formatTotal(itemsAmount, locale);
  const shippingFeeLabel = formatTotal(EXPRESS_POST_FEE_TOMAN, locale);
  const total = formatTotal(itemsAmount + shippingFee, locale);
  const lost = slugs.some((slug) => !holds[slug] || !getProduct(slug));
  const remaining = useCountdown(holdEndsAt);
  const ArrowIcon = locale === "fa" ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (!error) return;
    errorRef.current?.focus();
  }, [error]);

  useLayoutEffect(() => {
    if (!formVisible) return;
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [panel, formVisible]);

  useEffect(() => {
    const syncPanel = () => {
      setPanel(
        new URLSearchParams(window.location.search).get("step") === "delivery"
          ? "delivery"
          : "contact",
      );
    };
    const scrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    window.addEventListener("popstate", syncPanel);
    return () => {
      window.removeEventListener("popstate", syncPanel);
      window.history.scrollRestoration = scrollRestoration;
    };
  }, []);

  // The bag is not ready on the first render, so the form is not mounted
  // yet. Restore only once it is actually in the document — including a
  // later visit via browser back — without waiting on a one-shot mount effect.
  useLayoutEffect(() => {
    if (!formVisible) return;
    const form = formRef.current;
    if (!form) return;
    let draft = readDraft();
    const savedPanel =
      new URLSearchParams(window.location.search).get("step") === "delivery"
        ? "delivery"
        : "contact";
    const preset =
      addressStatus === "ready"
        ? defaultAddressToApply(draft, savedAddresses)
        : null;
    if (preset) {
      const next = deliveryFromSaved(preset);
      draft = {
        ...draft,
        ...next,
        addressChoice: "saved",
        savedAddressId: preset.id,
        panel: savedPanel,
      };
      writeDraft(draft);
      writeControls(form, next);
    }
    for (const name of [
      "address",
      "postalCode",
      "message",
      "recipientName",
      "recipientPhone",
      "giftMessage",
    ] as const) {
      const value = draft[name];
      if (value === undefined) continue;
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
    const nextPhone = seedCheckoutPhone({
      // A saved address replaces the profile prefill. A draft or what the
      // buyer already typed still wins inside seedCheckoutPhone.
      current: preset ? "" : (phoneRef.current?.value ?? ""),
      draftPhone: draft.phone,
      profilePhone: user?.phone,
    });
    const choice = addressChoiceOf(draft);
    // Session storage is read after mount so the server render stays empty.
    setPanel(savedPanel === "delivery" ? "delivery" : "contact");
    setProvinceId(location.provinceId);
    setCityId(location.cityId);
    setPhone(nextPhone);
    setAlternateRecipient(draft.alternateRecipient === true);
    setAddressChoice(choice);
    setSavedAddressId(savedAddressIdOf(draft));
    const nextShipping = normalizeShippingMethod(
      location.provinceId,
      location.cityId,
      draft.shippingMethod,
    );
    setShippingMethod(nextShipping);
    setFields({
      name: readControl(form, "name"),
      phone: nextPhone,
      provinceId: location.provinceId,
      cityId: location.cityId,
      address: readControl(form, "address"),
      postalCode: readControl(form, "postalCode"),
    });
  }, [addressStatus, formVisible, savedAddresses, user?.name, user?.phone]);

  useLayoutEffect(() => {
    const node = phoneRef.current;
    const caret = phoneCaret.current;
    if (!node || caret == null) return;
    node.setSelectionRange(caret, caret);
    phoneCaret.current = null;
  }, [phone]);

  const remember = (draft: Draft) => {
    const choice = addressChoiceOf(draft);
    const next: DeliveryFields = {
      name: draft.name ?? "",
      phone: draft.phone ?? "",
      provinceId: draft.provinceId ?? "",
      cityId: draft.cityId ?? "",
      address: draft.address ?? "",
      postalCode: draft.postalCode ?? "",
    };
    writeDraft({
      ...readDraft(),
      ...next,
      addressChoice: choice || undefined,
      savedAddressId: choice === "saved" ? (draft.savedAddressId ?? "") : "",
      panel: panelRef.current,
      alternateRecipient: draft.alternateRecipient,
      shippingMethod: normalizeShippingMethod(
        next.provinceId,
        next.cityId,
        shippingMethod,
      ),
    });
    setAlternateRecipient(draft.alternateRecipient === true);
    setFields(next);
    setAddressChoice(choice);
    setSavedAddressId(choice === "saved" ? (draft.savedAddressId ?? "") : "");
    setPhone(next.phone);
    setProvinceId(next.provinceId);
    setCityId(next.cityId);
    setShippingMethod(
      normalizeShippingMethod(next.provinceId, next.cityId, shippingMethod),
    );
    const form = formRef.current;
    if (form) writeControls(form, next);
    setErrors({});
  };

  const selectSaved = (address: (typeof savedAddresses)[number]) => {
    remember({
      ...deliveryFromSaved(address),
      addressChoice: "saved",
      savedAddressId: address.id,
    });
  };

  const selectManual = () => {
    remember({
      name: user?.name?.trim() ?? "",
      phone: user?.phone ? formatIranMobileDraft(user.phone) : "",
      provinceId: "",
      cityId: "",
      address: "",
      postalCode: "",
      addressChoice: "manual",
      savedAddressId: "",
    });
  };

  const changeRecipient = (checked: boolean) => {
    remember({
      name: formRef.current
        ? readControl(formRef.current, "name")
        : fields.name,
      phone,
      addressChoice: checked ? "manual" : undefined,
      alternateRecipient: checked,
    });
  };

  const storeDraft = (form: HTMLFormElement, patch?: Partial<Draft>) => {
    const data = new FormData(form);
    const choice = addressChoiceOf({ addressChoice, ...patch });
    const nextProvince = patch?.provinceId ?? provinceId;
    const nextCity = patch?.cityId ?? cityId;
    const nextShipping = normalizeShippingMethod(
      nextProvince,
      nextCity,
      patch && "shippingMethod" in patch
        ? patch.shippingMethod
        : shippingMethod,
    );
    setShippingMethod(nextShipping);
    writeDraft({
      name: String(data.get("name") ?? ""),
      phone,
      address: String(data.get("address") ?? ""),
      postalCode: String(data.get("postalCode") ?? ""),
      message: String(data.get("message") ?? ""),
      alternateRecipient,
      recipientName: String(data.get("recipientName") ?? ""),
      recipientPhone: String(data.get("recipientPhone") ?? ""),
      giftMessage: String(data.get("giftMessage") ?? ""),
      addressChoice: choice || undefined,
      savedAddressId: choice === "saved" ? savedAddressId : "",
      panel: panelRef.current,
      ...patch,
      provinceId: nextProvince,
      cityId: nextCity,
      shippingMethod: nextShipping,
    });
    const stored = readDraft();
    setFields({
      name: stored.name ?? "",
      phone: stored.phone ?? "",
      provinceId: stored.provinceId ?? "",
      cityId: stored.cityId ?? "",
      address: stored.address ?? "",
      postalCode: stored.postalCode ?? "",
    });
  };

  const persistDraft = (patch?: Partial<Draft>) => {
    const form = formRef.current;
    if (form) storeDraft(form, patch);
  };

  const phoneCopy = { empty: c.phoneEmpty, invalid: c.phoneError };

  const openPanel = (next: "contact" | "delivery") => {
    if (next === panel) return;
    persistDraft({ panel: next });
    const url = new URL(window.location.href);
    if (next === "delivery") {
      url.searchParams.set("step", "delivery");
      window.history.pushState({ radCheckoutDelivery: true }, "", url);
    } else if (window.history.state?.radCheckoutDelivery) {
      window.history.back();
      return;
    } else {
      url.searchParams.delete("step");
      window.history.replaceState(null, "", url);
    }
    setPanel(next);
  };

  const continueContact = () => {
    const form = formRef.current;
    if (!form) return;
    setPhoneTouched(true);
    const name = String(new FormData(form).get("name") ?? "").trim();
    const phoneError = iranMobileMessage(phone, true, phoneCopy);
    setFieldError("name", name.length < 2 ? c.nameError : undefined);
    setFieldError("phone", phoneError);
    if (name.length < 2) {
      form.querySelector<HTMLElement>('[name="name"]')?.focus();
      return;
    }
    if (phoneError) {
      phoneRef.current?.focus();
      return;
    }
    openPanel("delivery");
  };

  const selectStep = (step: CheckoutStepId) => {
    if (step === "contact" || step === "delivery") openPanel(step);
  };

  const validate = (data: FormData): FieldErrors => {
    const value = (key: "name" | "address") =>
      String(data.get(key) ?? "").trim();
    const next: FieldErrors = {};
    if (value("name").length < 2) next.name = c.nameError;
    const phoneError = iranMobileMessage(phone, true, phoneCopy);
    if (phoneError) next.phone = phoneError;
    if (alternateRecipient) {
      if (String(data.get("recipientName") ?? "").trim().length < 2) {
        next.recipientName = c.nameError;
      }
      const recipientError = iranMobileMessage(
        String(data.get("recipientPhone") ?? ""),
        true,
        phoneCopy,
      );
      if (recipientError) next.recipientPhone = recipientError;
    }
    const place = locationSelection(provinceId, cityId);
    if (!place.ok) {
      if (place.reason === "province") next.province = c.provinceError;
      else next.city = c.cityError;
    }
    if (value("address").length < 8) next.address = c.addressError;
    if (!validPostalOrEmpty(String(data.get("postalCode") ?? "")).ok) {
      next.postalCode = c.postalError;
    }
    return next;
  };

  const clearFieldError = (name: FieldName) => {
    setError("");
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

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
      const nextPanel =
        firstInvalid === "name" || firstInvalid === "phone"
          ? "contact"
          : "delivery";
      if (nextPanel !== panel) openPanel(nextPanel);
      window.setTimeout(() => {
        formRef.current
          ?.querySelector<HTMLElement>(`[name="${firstInvalid}"]`)
          ?.focus();
      }, 0);
      return;
    }
    if (!shippingMethod) {
      setError(c.shippingRequired);
      return;
    }
    if (!accepted) {
      setAgreeMissing(true);
      agreeRef.current?.focus();
      return;
    }

    const field = (key: string) => String(data.get(key) ?? "").trim();
    const postal = validPostalOrEmpty(field("postalCode"));
    const mobile = canonicalIranMobile(phone);
    const city = orderCitySnapshot(provinceId, cityId);
    if (!mobile || !city || !postal.ok) return;
    try {
      setError("");
      setSubmitting(true);
      const created = await placeOrder({
        name: field("name"),
        phone: mobile,
        city,
        address: orderAddressSnapshot(
          field("address"),
          postal.postal,
          c.postalLabel,
          locale,
        ),
        message: field("message") || undefined,
        recipientName: alternateRecipient ? field("recipientName") : undefined,
        recipientPhone: alternateRecipient
          ? (canonicalIranMobile(field("recipientPhone")) ?? undefined)
          : undefined,
        giftMessage: field("giftMessage") || undefined,
        acceptedPolicies: currentPolicyVersions(ORDER_POLICY_SLUGS),
        shippingMethod,
      });
      setLeaving(true);
      clearDraft();
      // The order now owns the reservation. Replace the editable delivery
      // entry with the saved delivery snapshot before opening payment.
      router.replace(
        href(
          `/checkout/${encodeURIComponent(created.id)}?step=delivery&advance=payment`,
        ),
      );
      // Checkout already deleted this bag. A second DELETE would release a
      // hold created after that transaction — another tab can add a work
      // while catalog refresh is still in flight. `placeOrder` reloads the
      // bag from the server instead.
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
        <CheckoutSteps current="payment" />
        <p className="checkout-flow-leaving" role="status">
          {c.leaving}
        </p>
      </section>
    );
  }

  if (!ready) {
    return (
      <section className="checkout-flow section" aria-busy="true">
        <CheckoutSteps current="contact" />
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
        <CheckoutSteps current="contact" />
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
  const selectedAddress = savedAddresses.find(
    (item) => item.id === savedAddressId,
  );
  const deliveryDiverged =
    addressChoice === "saved" && selectedAddress
      ? !sameDelivery(fields, selectedAddress)
      : false;
  const savedMissing =
    addressChoice === "saved" &&
    addressStatus === "ready" &&
    savedAddressId !== "" &&
    !selectedAddress;
  const fieldProps = (name: FieldName) => ({
    id: `checkout-${name}`,
    name,
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `checkout-${name}-error` : undefined,
    onInput: (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      clearFieldError(name);
      const form = event.currentTarget.form;
      if (form) storeDraft(form);
    },
    disabled: busy,
  });

  const StageIcon = panel === "contact" ? UserRound : Truck;

  return (
    <section className="checkout-flow section" data-panel={panel}>
      <CheckoutSteps current={panel} onSelect={selectStep} />
      <header className="checkout-flow-head">
        {panel === "delivery" ? (
          <button
            type="button"
            className="checkout-back"
            onClick={() => openPanel("contact")}
            disabled={busy}
          >
            <ArrowIcon aria-hidden="true" />
            {c.back}
          </button>
        ) : null}
        <h1 ref={headingRef} tabIndex={-1}>
          <StageIcon aria-hidden="true" />
          {panel === "contact" ? c.contactTitle : c.detailsTitle}
        </h1>
        <p>{panel === "contact" ? c.contactLede : c.detailsLede}</p>
      </header>

      <div className="checkout-flow-body">
        <form
          id={FORM_ID}
          ref={formRef}
          className="checkout-flow-main checkout-details"
          onSubmit={submit}
          noValidate
        >
          <div className="checkout-panel" hidden={panel !== "contact"}>
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
            <CheckoutAccountOffer
              name={fields.name}
              phone={phone}
              disabled={busy}
              copy={c}
            />
          </div>
          <div className="checkout-panel" hidden={panel !== "delivery"}>
            {signedIn && !alternateRecipient ? (
              <SavedAddressPicker
                status={addressStatus === "idle" ? "loading" : addressStatus}
                addresses={savedAddresses}
                choice={addressChoice}
                savedAddressId={savedAddressId}
                diverged={deliveryDiverged}
                missing={savedMissing}
                disabled={busy}
                copy={c}
                onSelect={selectSaved}
                onManual={selectManual}
                onRetry={retryAddresses}
              />
            ) : null}
            <label className="checkout-recipient-toggle">
              <input
                type="checkbox"
                checked={alternateRecipient}
                disabled={busy}
                onChange={(event) =>
                  changeRecipient(event.currentTarget.checked)
                }
              />
              <span>{c.alternateRecipient}</span>
            </label>
            <div
              className="checkout-recipient-fields"
              hidden={!alternateRecipient}
            >
              <CheckoutField
                id="checkout-recipientName"
                label={c.recipientName}
                error={errors.recipientName}
              >
                <input
                  {...fieldProps("recipientName")}
                  maxLength={120}
                  autoComplete="shipping name"
                />
              </CheckoutField>
              <CheckoutField
                id="checkout-recipientPhone"
                label={c.recipientPhone}
                error={errors.recipientPhone}
              >
                <input
                  {...fieldProps("recipientPhone")}
                  type="tel"
                  inputMode="tel"
                  dir="ltr"
                  maxLength={32}
                  autoComplete="shipping tel"
                />
              </CheckoutField>
            </div>
            <div className="checkout-location-row">
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
                  const city = cityAfterProvinceChange(
                    provinceId,
                    next,
                    cityId,
                  );
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
                  setFieldError(
                    "province",
                    value ? undefined : c.provinceError,
                  );
                }}
                onCityBlur={(value) => {
                  if (!provinceId) return;
                  setFieldError("city", value ? undefined : c.cityError);
                }}
              />
            </div>
            <ShippingOptions
              provinceId={provinceId}
              cityId={cityId}
              method={shippingMethod}
              feeLabel={shippingFeeLabel}
              disabled={busy}
              copy={c}
              onChange={(next) => {
                setShippingMethod(next);
                setError("");
                persistDraft({ shippingMethod: next });
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
              error={errors.postalCode}
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
                aria-invalid={errors.postalCode ? true : undefined}
                aria-describedby={
                  errors.postalCode ? "checkout-postal-error" : undefined
                }
                onInput={(event) => {
                  clearFieldError("postalCode");
                  const form = event.currentTarget.form;
                  if (form) storeDraft(form);
                }}
                onBlur={(event) => {
                  const postal = validPostalOrEmpty(event.currentTarget.value);
                  setFieldError(
                    "postalCode",
                    postal.ok ? undefined : c.postalError,
                  );
                }}
              />
            </CheckoutField>
            <CheckoutField
              id="checkout-giftMessage"
              label={c.giftMessage}
              optional={c.optional}
              wide
            >
              <p id="checkout-gift-hint" className="checkout-gift-hint">
                {c.giftMessageHint}
              </p>
              <textarea
                id="checkout-giftMessage"
                name="giftMessage"
                rows={3}
                maxLength={240}
                disabled={busy}
                aria-describedby="checkout-gift-hint"
                onInput={(event) => {
                  const form = event.currentTarget.form;
                  if (form) storeDraft(form);
                }}
              />
            </CheckoutField>
            <CheckoutField
              id="checkout-message"
              label={c.messageLabel}
              optional={c.optional}
              wide
            >
              <textarea
                id="checkout-message"
                name="message"
                className="resize-none"
                rows={2}
                maxLength={500}
                disabled={busy}
                placeholder={c.messagePlaceholder}
                onInput={(event) => {
                  setError("");
                  const form = event.currentTarget.form;
                  if (form) storeDraft(form);
                }}
              />
            </CheckoutField>
          </div>
        </form>

        <aside className="checkout-flow-aside">
          <CheckoutSummary
            items={items}
            itemsTotal={itemsTotal}
            total={total}
            shippingMethod={shippingMethod}
            shippingFee={shippingFeeLabel}
          />
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
        </aside>

        <div className="checkout-flow-action">
          {panel === "delivery" ? (
            <CheckoutAgreement
              ref={agreeRef}
              checked={accepted}
              invalid={agreeMissing}
              onChange={(checked) => {
                setAccepted(checked);
                if (checked) setAgreeMissing(false);
              }}
            />
          ) : null}

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

          {panel === "contact" ? (
            <button
              type="button"
              className="checkout-submit"
              disabled={busy || lost}
              onClick={continueContact}
            >
              <span>{c.contactContinue}</span>
              <ArrowIcon aria-hidden="true" />
            </button>
          ) : null}
          {panel === "delivery" ? (
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
          ) : null}
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
