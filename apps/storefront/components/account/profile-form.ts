import {
  canonicalIranMobile,
  formatIranMobileDraft,
} from "@/lib/phone/iran-mobile";

export const PROFILE_NAME_MAX = 80;

export type ProfileDraft = {
  name: string;
  phone: string;
};

export type ProfileUser = {
  name: string;
  email: string;
  phone?: string | null;
};

export type ProfileField = "name" | "phone";

export type ProfileFormState = {
  draft: ProfileDraft;
  saved: ProfileDraft;
  phase: "idle" | "saving" | "saved" | "error";
  errors: Partial<Record<ProfileField, string>>;
  message: string;
};

export type ProfileCopy = {
  nameInvalid: string;
  nameTooLong: string;
  phoneInvalid: string;
};

export function profileDraftFromUser(user: {
  name: string;
  phone?: string | null;
}): ProfileDraft {
  return {
    name: user.name,
    phone: user.phone ? formatIranMobileDraft(user.phone) : "",
  };
}

export function initialProfileState(user: ProfileUser): ProfileFormState {
  const draft = profileDraftFromUser(user);
  return {
    draft,
    saved: draft,
    phase: "idle",
    errors: {},
    message: "",
  };
}

export function profileIsDirty(state: ProfileFormState) {
  return (
    state.draft.name !== state.saved.name ||
    state.draft.phone !== state.saved.phone
  );
}

/** Name plus a canonical mobile, or an empty phone when the field is blank. */
export function profileUpdatePayload(draft: ProfileDraft) {
  const name = draft.name.trim().replace(/\s+/g, " ");
  const phone = canonicalIranMobile(draft.phone) ?? "";
  return { name, phone };
}

export function reduceProfileForm(
  state: ProfileFormState,
  action:
    | { type: "edit"; field: ProfileField; value: string }
    | { type: "submit"; copy: ProfileCopy }
    | { type: "success"; user: ProfileUser }
    | { type: "failure"; message: string }
    | { type: "user"; user: ProfileUser },
): ProfileFormState {
  if (action.type === "edit") {
    if (state.phase === "saving") return state;
    return {
      ...state,
      phase: "idle",
      message: "",
      errors: { ...state.errors, [action.field]: undefined },
      draft: { ...state.draft, [action.field]: action.value },
    };
  }

  if (action.type === "user") {
    const incoming = profileDraftFromUser(action.user);
    if (profileIsDirty(state) || state.phase === "saving") return state;
    return { ...state, draft: incoming, saved: incoming };
  }

  if (action.type === "submit") {
    if (state.phase === "saving") return state;
    const name = state.draft.name.trim().replace(/\s+/g, " ");
    const errors: ProfileFormState["errors"] = {};
    if (name.length < 2) errors.name = action.copy.nameInvalid;
    else if (name.length > PROFILE_NAME_MAX)
      errors.name = action.copy.nameTooLong;
    if (state.draft.phone.trim() && !canonicalIranMobile(state.draft.phone)) {
      errors.phone = action.copy.phoneInvalid;
    }
    if (errors.name || errors.phone) {
      return { ...state, phase: "error", errors, message: "" };
    }
    return {
      ...state,
      phase: "saving",
      errors: {},
      message: "",
      draft: { ...state.draft, name },
    };
  }

  if (action.type === "failure") {
    return {
      ...state,
      phase: "error",
      message: action.message,
    };
  }

  const saved = profileDraftFromUser(action.user);
  return {
    draft: saved,
    saved,
    phase: "saved",
    errors: {},
    message: "",
  };
}
