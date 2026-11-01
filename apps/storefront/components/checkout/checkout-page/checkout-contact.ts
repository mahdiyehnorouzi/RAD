import { formatIranMobileDraft } from "@/lib/phone/iran-mobile";

/** Prefill checkout contact fields without overwriting a draft or what the buyer already typed. */
export function seedCheckoutName(input: {
  current: string;
  draftName?: string;
  profileName?: string | null;
}) {
  const profile = input.profileName?.trim() ?? "";
  if (input.draftName !== undefined) {
    const typed =
      input.current.trim() &&
      input.current !== profile &&
      input.current !== input.draftName;
    return typed ? input.current : input.draftName;
  }
  if (input.current.trim()) return input.current;
  return profile;
}

export function seedCheckoutPhone(input: {
  current: string;
  draftPhone?: string;
  profilePhone?: string | null;
}) {
  if (input.current.trim()) return input.current;
  if (input.draftPhone !== undefined) {
    return input.draftPhone.trim()
      ? formatIranMobileDraft(input.draftPhone)
      : "";
  }
  return input.profilePhone ? formatIranMobileDraft(input.profilePhone) : "";
}
