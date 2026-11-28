"use client";

import { fillCopy } from "../const";
import { isTehranCity, type CheckoutShippingMethod } from "./checkout-shipping";
import type { checkoutCopy } from "../const";

type Copy = (typeof checkoutCopy)["fa"] | (typeof checkoutCopy)["en"];

export function ShippingOptions({
  provinceId,
  cityId,
  method,
  feeLabel,
  disabled = false,
  copy,
  onChange,
}: {
  provinceId: string;
  cityId: string;
  method: CheckoutShippingMethod | "";
  /** Server fee, already formatted, e.g. «۱۵۰٬۰۰۰ تومان». */
  feeLabel: string;
  disabled?: boolean;
  copy: Copy;
  onChange: (method: CheckoutShippingMethod | "") => void;
}) {
  const tehran = isTehranCity(provinceId, cityId);

  return (
    <fieldset className="checkout-shipping" disabled={disabled}>
      <legend>{copy.shippingLegend}</legend>
      <label className="checkout-shipping-option">
        <input
          type="radio"
          name="shippingMethod"
          value="express"
          checked={method === "express"}
          onChange={() => onChange("express")}
        />
        <span>
          <b>{copy.shippingExpress}</b>
          <small>
            {fillCopy(copy.shippingExpressDetail, { fee: feeLabel })}
          </small>
        </span>
      </label>
      <label className="checkout-shipping-option">
        <input
          type="radio"
          name="shippingMethod"
          value="courier"
          checked={method === "courier" && tehran}
          disabled={!tehran}
          onChange={() => {
            if (tehran) onChange("courier");
          }}
        />
        <span>
          <b>{copy.shippingCourier}</b>
          <small>
            {tehran ? copy.shippingCourierLater : copy.shippingCourierOutside}
          </small>
        </span>
      </label>
    </fieldset>
  );
}
