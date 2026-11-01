import type { CustomerAddress } from "@rad/types";

export type AddressDraft = {
  recipientName: string;
  phone: string;
  provinceId: string;
  cityId: string;
  address: string;
  postalCode: string;
  isDefault: boolean;
};

export type AddressErrors = Partial<{
  recipientName: string;
  phone: string;
  provinceId: string;
  cityId: string;
  address: string;
  postalCode: string;
}>;

export type AddressField = keyof AddressErrors;

export type AddressCopy = {
  nameInvalid: string;
  nameTooLong: string;
  phoneEmpty: string;
  phoneInvalid: string;
  provinceInvalid: string;
  cityInvalid: string;
  addressInvalid: string;
  addressTooLong: string;
  postalInvalid: string;
};

type AddressNotice = {
  tone: "success" | "error";
  text: string;
};

export type AddressBookState = {
  phase: "loading" | "load-error" | "ready" | "saving" | "deleting";
  view: "list" | "create" | "edit" | "delete";
  editingId: string;
  busyId: string;
  addresses: CustomerAddress[];
  draft: AddressDraft;
  origin: AddressDraft;
  errors: AddressErrors;
  notice: AddressNotice | null;
};
