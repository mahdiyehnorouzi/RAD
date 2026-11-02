"use client";

import { useEffect, useReducer, useState } from "react";
import type { MessageKey } from "@/i18n/fa";
import { ApiError, readableErrorMessage } from "@/lib/api";
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  setDefaultAddress,
  updateAddress,
} from "@/lib/api";
import { useCommerce } from "@/components/commerce";
import { useLocale } from "@/components/i18n";
import {
  addressPayload,
  initialAddressBookState,
  reduceAddressBook,
} from "../address-book-state";
import type { AddressCopy } from "../type";

const ADDRESS_CODES: Record<string, MessageKey> = {
  name_invalid: "addressesNameError",
  name_too_long: "addressesNameTooLong",
  phone_invalid: "addressesPhoneError",
  province_invalid: "addressesProvinceError",
  city_invalid: "addressesCityError",
  city_mismatch: "addressesCityError",
  address_invalid: "addressesLineError",
  address_too_long: "addressesLineTooLong",
  postal_invalid: "addressesPostalError",
  address_limit: "addressesLimit",
  address_not_found: "addressesMissing",
  auth_required: "addressesSaveFailed",
  default_conflict: "addressesDefaultFailed",
};

export function useAddressBook() {
  const { t } = useLocale();
  const { user, ready } = useCommerce();
  const userId = user?.id ?? "";
  const [state, dispatch] = useReducer(
    reduceAddressBook,
    initialAddressBookState,
  );
  const [generation, setGeneration] = useState(0);
  const copy: AddressCopy = {
    nameInvalid: t("addressesNameError"),
    nameTooLong: t("addressesNameTooLong"),
    phoneEmpty: t("addressesPhoneEmpty"),
    phoneInvalid: t("addressesPhoneError"),
    provinceInvalid: t("addressesProvinceError"),
    cityInvalid: t("addressesCityError"),
    addressInvalid: t("addressesLineError"),
    addressTooLong: t("addressesLineTooLong"),
    postalInvalid: t("addressesPostalError"),
  };

  useEffect(() => {
    // The page stays mounted behind the account login form. A fetch before
    // the session cookie exists would stick as an error after sign-in.
    if (!ready || !userId) {
      dispatch({ type: "reset" });
      return;
    }
    let ignore = false;
    fetchAddresses()
      .then((result) => {
        if (!ignore) dispatch({ type: "loaded", addresses: result.addresses });
      })
      .catch((error: unknown) => {
        if (!ignore) {
          dispatch({
            type: "load-failed",
            text: failureText(error, t("addressesLoadFailed"), t),
          });
        }
      });
    return () => {
      ignore = true;
    };
  }, [generation, ready, t, userId]);

  return {
    state,
    dispatch,
    copy,
    retry: () => {
      dispatch({ type: "retry" });
      setGeneration((current) => current + 1);
    },
    submit: () => {
      const next = reduceAddressBook(state, { type: "submit", copy });
      dispatch({ type: "submit", copy });
      if (next.phase !== "saving") return;
      const mode = state.view === "edit" ? "edit" : "create";
      const payload = addressPayload(state.draft, mode);
      const request =
        mode === "edit"
          ? updateAddress(state.editingId, payload)
          : createAddress(payload);
      request
        .then((result) =>
          dispatch({
            type: "saved",
            addresses: result.addresses,
            text: t(mode === "edit" ? "addressesUpdated" : "addressesSaved"),
          }),
        )
        .catch((error: unknown) =>
          dispatch({
            type: "save-failed",
            text: failureText(error, t("addressesSaveFailed"), t),
          }),
        );
    },
    confirmDelete: () => {
      const next = reduceAddressBook(state, { type: "confirm-delete" });
      dispatch({ type: "confirm-delete" });
      if (next.phase !== "deleting") return;
      deleteAddress(state.editingId)
        .then((result) =>
          dispatch({
            type: "deleted",
            addresses: result.addresses,
            text: t("addressesDeleted"),
          }),
        )
        .catch((error: unknown) =>
          dispatch({
            type: "delete-failed",
            text: failureText(error, t("addressesDeleteFailed"), t),
          }),
        );
    },
    setDefault: (id: string) => {
      const next = reduceAddressBook(state, { type: "set-default", id });
      dispatch({ type: "set-default", id });
      if (!next.busyId) return;
      setDefaultAddress(id)
        .then((result) =>
          dispatch({
            type: "default-saved",
            addresses: result.addresses,
            text: t("addressesDefaultSaved"),
          }),
        )
        .catch((error: unknown) =>
          dispatch({
            type: "default-failed",
            text: failureText(error, t("addressesDefaultFailed"), t),
          }),
        );
    },
  };
}

function failureText(
  error: unknown,
  fallback: string,
  t: (key: MessageKey) => string,
) {
  if (error instanceof ApiError && error.code && ADDRESS_CODES[error.code]) {
    return t(ADDRESS_CODES[error.code]);
  }
  return readableErrorMessage(error, fallback);
}
