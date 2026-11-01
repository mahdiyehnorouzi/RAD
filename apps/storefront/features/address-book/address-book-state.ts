import type { CustomerAddress, CustomerAddressInput } from "@rad/types";
import {
  cityAfterProvinceChange,
  locationSelection,
} from "@/lib/geo/iran-locations";
import { toLatinDigits } from "@/lib/payment/receipt";
import {
  canonicalIranMobile,
  formatIranMobileDraft,
  iranMobileMessage,
} from "@/lib/phone/iran-mobile";
import {
  ADDRESS_BOOK_LIMIT,
  ADDRESS_LINE_MAX,
  ADDRESS_LINE_MIN,
  ADDRESS_NAME_MAX,
  ADDRESS_NAME_MIN,
  POSTAL_CODE_LENGTH,
} from "./const";
import type {
  AddressBookState,
  AddressCopy,
  AddressDraft,
  AddressErrors,
  AddressField,
} from "./type";

function emptyAddressDraft(): AddressDraft {
  return {
    recipientName: "",
    phone: "",
    provinceId: "",
    cityId: "",
    address: "",
    postalCode: "",
    isDefault: true,
  };
}

export function draftFromAddress(address: CustomerAddress): AddressDraft {
  return {
    recipientName: address.recipientName,
    phone: formatIranMobileDraft(address.phone),
    provinceId: address.provinceId,
    cityId: address.cityId,
    address: address.address,
    postalCode: address.postalCode ?? "",
    isDefault: address.isDefault,
  };
}

export const initialAddressBookState: AddressBookState = {
  phase: "loading",
  view: "list",
  editingId: "",
  busyId: "",
  addresses: [],
  draft: emptyAddressDraft(),
  origin: emptyAddressDraft(),
  errors: {},
  notice: null,
};

export function addressDraftDirty(state: AddressBookState) {
  if (state.view !== "create" && state.view !== "edit") return false;
  return JSON.stringify(state.draft) !== JSON.stringify(state.origin);
}

function validateAddressDraft(
  draft: AddressDraft,
  copy: AddressCopy,
): AddressErrors {
  const errors: AddressErrors = {};
  const name = draft.recipientName.trim().replace(/\s+/g, " ");
  if (name.length < ADDRESS_NAME_MIN) errors.recipientName = copy.nameInvalid;
  else if (name.length > ADDRESS_NAME_MAX)
    errors.recipientName = copy.nameTooLong;

  const phoneError = iranMobileMessage(draft.phone, true, {
    empty: copy.phoneEmpty,
    invalid: copy.phoneInvalid,
  });
  if (phoneError) errors.phone = phoneError;

  const place = locationSelection(draft.provinceId, draft.cityId);
  if (!place.ok) {
    if (place.reason === "province") errors.provinceId = copy.provinceInvalid;
    else errors.cityId = copy.cityInvalid;
  }

  const address = draft.address.trim();
  if (address.length < ADDRESS_LINE_MIN) errors.address = copy.addressInvalid;
  else if (address.length > ADDRESS_LINE_MAX)
    errors.address = copy.addressTooLong;

  if (draft.postalCode.trim()) {
    const postal = toLatinDigits(draft.postalCode).replace(/[\s-]/g, "");
    if (!new RegExp(`^\\d{${POSTAL_CODE_LENGTH}}$`).test(postal)) {
      errors.postalCode = copy.postalInvalid;
    }
  }
  return errors;
}

export function addressPayload(
  draft: AddressDraft,
  mode: "create" | "edit",
): CustomerAddressInput & { isDefault?: boolean } {
  const postal = toLatinDigits(draft.postalCode).replace(/[\s-]/g, "");
  const body: CustomerAddressInput & { isDefault?: boolean } = {
    recipientName: draft.recipientName.trim().replace(/\s+/g, " "),
    phone: canonicalIranMobile(draft.phone) ?? "",
    provinceId: draft.provinceId,
    cityId: draft.cityId,
    address: draft.address.trim(),
    postalCode: postal,
  };
  if (mode === "create") body.isDefault = draft.isDefault;
  return body;
}

export type AddressBookAction =
  | { type: "reset" }
  | { type: "loaded"; addresses: CustomerAddress[] }
  | { type: "load-failed"; text: string }
  | { type: "retry" }
  | { type: "create" }
  | { type: "edit"; address: CustomerAddress }
  | { type: "cancel" }
  | {
      type: "draft";
      field: AddressField | "isDefault";
      value: string | boolean;
    }
  | { type: "province"; provinceId: string }
  | { type: "submit"; copy: AddressCopy }
  | { type: "saved"; addresses: CustomerAddress[]; text: string }
  | { type: "save-failed"; text: string }
  | { type: "ask-delete"; id: string }
  | { type: "confirm-delete" }
  | { type: "deleted"; addresses: CustomerAddress[]; text: string }
  | { type: "delete-failed"; text: string }
  | { type: "set-default"; id: string }
  | { type: "default-saved"; addresses: CustomerAddress[]; text: string }
  | { type: "default-failed"; text: string };

function readyList(
  state: AddressBookState,
  addresses: CustomerAddress[],
  notice: AddressBookState["notice"],
): AddressBookState {
  const draft = emptyAddressDraft();
  return {
    ...state,
    phase: "ready",
    view: "list",
    editingId: "",
    busyId: "",
    addresses,
    draft,
    origin: draft,
    errors: {},
    notice,
  };
}

export function reduceAddressBook(
  state: AddressBookState,
  action: AddressBookAction,
): AddressBookState {
  switch (action.type) {
    case "reset":
      return initialAddressBookState;
    case "loaded":
      return readyList(state, action.addresses, null);
    case "load-failed":
      return {
        ...state,
        phase: "load-error",
        view: "list",
        addresses: [],
        busyId: "",
        notice: { tone: "error", text: action.text },
      };
    case "retry":
      if (state.phase !== "load-error") return state;
      return { ...state, phase: "loading", notice: null };
    case "create": {
      if (state.phase !== "ready" || state.view !== "list") return state;
      if (state.addresses.length >= ADDRESS_BOOK_LIMIT) return state;
      const draft = {
        ...emptyAddressDraft(),
        isDefault: state.addresses.length === 0,
      };
      return {
        ...state,
        view: "create",
        editingId: "",
        draft,
        origin: draft,
        errors: {},
        notice: null,
      };
    }
    case "edit": {
      if (state.phase !== "ready" || state.view !== "list") return state;
      const draft = draftFromAddress(action.address);
      return {
        ...state,
        view: "edit",
        editingId: action.address.id,
        draft,
        origin: draft,
        errors: {},
        notice: null,
      };
    }
    case "cancel":
      if (state.phase === "saving" || state.phase === "deleting") return state;
      if (state.view === "list") return state;
      return readyList(state, state.addresses, state.notice);
    case "draft": {
      if (action.field === "isDefault") {
        return {
          ...state,
          draft: { ...state.draft, isDefault: action.value === true },
        };
      }
      const errors = { ...state.errors };
      delete errors[action.field];
      return {
        ...state,
        draft: { ...state.draft, [action.field]: String(action.value) },
        errors,
      };
    }
    case "province": {
      const cityId = cityAfterProvinceChange(
        state.draft.provinceId,
        action.provinceId,
        state.draft.cityId,
      );
      const errors = { ...state.errors };
      delete errors.provinceId;
      delete errors.cityId;
      return {
        ...state,
        draft: { ...state.draft, provinceId: action.provinceId, cityId },
        errors,
      };
    }
    case "submit": {
      if (state.phase !== "ready") return state;
      if (state.view !== "create" && state.view !== "edit") return state;
      const errors = validateAddressDraft(state.draft, action.copy);
      if (Object.keys(errors).length) {
        return { ...state, errors, notice: null };
      }
      return { ...state, phase: "saving", errors: {} };
    }
    case "saved":
      return readyList(state, action.addresses, {
        tone: "success",
        text: action.text,
      });
    case "save-failed":
      if (state.phase !== "saving") return state;
      return {
        ...state,
        phase: "ready",
        notice: { tone: "error", text: action.text },
      };
    case "ask-delete":
      if (state.phase !== "ready" || state.view !== "list") return state;
      if (!state.addresses.some((address) => address.id === action.id)) {
        return state;
      }
      return {
        ...state,
        view: "delete",
        editingId: action.id,
        notice: null,
      };
    case "confirm-delete":
      if (state.phase !== "ready" || state.view !== "delete") return state;
      return { ...state, phase: "deleting" };
    case "deleted":
      return readyList(state, action.addresses, {
        tone: "success",
        text: action.text,
      });
    case "delete-failed":
      if (state.phase !== "deleting") return state;
      return {
        ...state,
        phase: "ready",
        notice: { tone: "error", text: action.text },
      };
    case "set-default":
      if (state.phase !== "ready" || state.view !== "list") return state;
      if (!state.addresses.some((address) => address.id === action.id)) {
        return state;
      }
      return { ...state, busyId: action.id, notice: null };
    case "default-saved":
      return {
        ...readyList(state, action.addresses, {
          tone: "success",
          text: action.text,
        }),
      };
    case "default-failed":
      return {
        ...state,
        busyId: "",
        phase: "ready",
        notice: { tone: "error", text: action.text },
      };
    default:
      return state;
  }
}
