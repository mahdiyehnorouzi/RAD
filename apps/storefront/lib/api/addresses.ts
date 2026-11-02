import type { CustomerAddressInput, CustomerAddressList } from "@rad/types";
import { api } from "./client";

export function fetchAddresses() {
  return api<CustomerAddressList>("/account/addresses");
}

export function createAddress(
  input: CustomerAddressInput & { isDefault?: boolean },
) {
  return api<CustomerAddressList>("/account/addresses", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateAddress(id: string, input: CustomerAddressInput) {
  return api<CustomerAddressList>(
    `/account/addresses/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export function deleteAddress(id: string) {
  return api<CustomerAddressList>(
    `/account/addresses/${encodeURIComponent(id)}`,
    { method: "DELETE" },
  );
}

export function setDefaultAddress(id: string) {
  return api<CustomerAddressList>(
    `/account/addresses/${encodeURIComponent(id)}/default`,
    { method: "POST" },
  );
}
