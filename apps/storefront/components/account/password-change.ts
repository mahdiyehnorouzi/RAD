import { ApiError, isNetworkError, readableErrorMessage } from "@/lib/api";
import type { MessageKey } from "@/i18n/fa";

const PASSWORD_MIN_LENGTH = 8;

const PASSWORD_CODES: Partial<Record<string, MessageKey>> = {
  unauthenticated: "passwordSignInRequired",
  password_incorrect: "passwordCurrentWrong",
  password_unset: "passwordUnset",
  password_reused: "passwordReused",
  password_invalid: "passwordTooShort",
  account_inactive: "accountInactive",
};

/** Known API codes stay in the active language. Other Persian API text is shown as-is. */
export function passwordChangeMessage(
  error: unknown,
  text: (key: MessageKey) => string,
) {
  if (isNetworkError(error)) return text("passwordChangeFailed");
  const code = error instanceof ApiError ? error.code : undefined;
  const key = code ? PASSWORD_CODES[code] : undefined;
  if (key) return text(key);
  return readableErrorMessage(error, text("passwordChangeFailed"));
}

export type PasswordField = "current" | "next" | "confirm";

type PasswordDraft = Record<PasswordField, string>;

type PasswordFormState = {
  draft: PasswordDraft;
  phase: "idle" | "saving" | "saved" | "error";
  errors: Partial<Record<PasswordField, string>>;
  message: string;
};

export type PasswordCopy = {
  currentRequired: string;
  tooShort: string;
  mismatch: string;
  reused: string;
};

const emptyDraft = (): PasswordDraft => ({
  current: "",
  next: "",
  confirm: "",
});

export function initialPasswordState(): PasswordFormState {
  return {
    draft: emptyDraft(),
    phase: "idle",
    errors: {},
    message: "",
  };
}

export function reducePasswordForm(
  state: PasswordFormState,
  action:
    | { type: "edit"; field: PasswordField; value: string }
    | { type: "submit"; copy: PasswordCopy }
    | { type: "success" }
    | { type: "failure"; message: string },
): PasswordFormState {
  if (action.type === "edit") {
    if (state.phase === "saving") return state;
    return {
      ...state,
      phase: state.phase === "saved" ? "idle" : state.phase,
      message: state.phase === "error" ? "" : state.message,
      errors: { ...state.errors, [action.field]: undefined },
      draft: { ...state.draft, [action.field]: action.value },
    };
  }

  if (action.type === "submit") {
    if (state.phase === "saving") return state;
    const errors: PasswordFormState["errors"] = {};
    if (!state.draft.current) {
      errors.current = action.copy.currentRequired;
    } else if (state.draft.current.length < PASSWORD_MIN_LENGTH) {
      errors.current = action.copy.tooShort;
    }
    if (state.draft.next.length < PASSWORD_MIN_LENGTH) {
      errors.next = action.copy.tooShort;
    } else if (
      state.draft.current &&
      state.draft.next === state.draft.current
    ) {
      errors.next = action.copy.reused;
    }
    if (state.draft.next !== state.draft.confirm) {
      errors.confirm = action.copy.mismatch;
    }
    if (errors.current || errors.next || errors.confirm) {
      return { ...state, phase: "error", errors, message: "" };
    }
    return { ...state, phase: "saving", errors: {}, message: "" };
  }

  if (action.type === "success") {
    return {
      draft: emptyDraft(),
      phase: "saved",
      errors: {},
      message: "",
    };
  }

  return {
    ...state,
    phase: "error",
    message: action.message,
  };
}
