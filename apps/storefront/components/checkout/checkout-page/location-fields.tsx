"use client";

import { ChevronDown } from "lucide-react";
import { IRAN_PROVINCES, citiesInProvince } from "@/lib/geo/iran-locations";
import { CheckoutField } from "./checkout-field";

function LocationSelect({
  id,
  name,
  value,
  placeholder,
  options,
  disabled,
  invalid,
  describedBy,
  autoComplete,
  onChange,
  onBlur,
}: {
  id: string;
  name: string;
  value: string;
  placeholder: string;
  options: readonly { id: string; label: string }[];
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
  autoComplete: string;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
}) {
  return (
    <div className="checkout-select">
      <select
        id={id}
        name={name}
        value={value}
        disabled={disabled}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
        aria-required="true"
        autoComplete={autoComplete}
        className={value ? undefined : "is-empty"}
        onChange={(event) => onChange(event.currentTarget.value)}
        onBlur={(event) => onBlur(event.currentTarget.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown aria-hidden="true" />
    </div>
  );
}

export function LocationFields({
  provinceId,
  cityId,
  provinceLabel,
  cityLabel,
  provincePlaceholder,
  cityPlaceholder,
  cityWaiting,
  provinceError,
  cityError,
  disabled,
  onProvince,
  onCity,
  onProvinceBlur,
  onCityBlur,
}: {
  provinceId: string;
  cityId: string;
  provinceLabel: string;
  cityLabel: string;
  provincePlaceholder: string;
  cityPlaceholder: string;
  cityWaiting: string;
  provinceError?: string;
  cityError?: string;
  disabled?: boolean;
  onProvince: (provinceId: string) => void;
  onCity: (cityId: string) => void;
  onProvinceBlur: (provinceId: string) => void;
  onCityBlur: (cityId: string) => void;
}) {
  const cities = citiesInProvince(provinceId);
  return (
    <>
      <CheckoutField
        id="checkout-province"
        label={provinceLabel}
        error={provinceError}
      >
        <LocationSelect
          id="checkout-province"
          name="province"
          value={provinceId}
          placeholder={provincePlaceholder}
          options={IRAN_PROVINCES}
          disabled={disabled}
          invalid={Boolean(provinceError)}
          describedBy={provinceError ? "checkout-province-error" : undefined}
          autoComplete="address-level1"
          onChange={onProvince}
          onBlur={onProvinceBlur}
        />
      </CheckoutField>
      <CheckoutField id="checkout-city" label={cityLabel} error={cityError}>
        <LocationSelect
          id="checkout-city"
          name="city"
          value={cityId}
          placeholder={provinceId ? cityPlaceholder : cityWaiting}
          options={cities}
          disabled={disabled || !provinceId}
          invalid={Boolean(cityError)}
          describedBy={cityError ? "checkout-city-error" : undefined}
          autoComplete="address-level2"
          onChange={onCity}
          onBlur={onCityBlur}
        />
      </CheckoutField>
    </>
  );
}
