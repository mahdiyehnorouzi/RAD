export const PROFILE_SECTIONS = [
  "collection",
  "orders",
  "making",
  "favorites",
  "notifications",
  "addresses",
  "info",
] as const;

export type ProfileSection = (typeof PROFILE_SECTIONS)[number];

export function isProfileSection(value: unknown): value is ProfileSection {
  return (
    typeof value === "string" &&
    (PROFILE_SECTIONS as readonly string[]).includes(value)
  );
}

/** First paint follows the address the visitor opened. Later tab changes do not. */
export function profileSectionFromPath(pathname: string): ProfileSection {
  const path = pathname.replace(/\/$/, "") || "/";
  if (path === "/orders" || path.startsWith("/orders/")) return "orders";
  if (path === "/account/making" || path.startsWith("/making/")) return "making";
  if (path === "/favorites") return "favorites";
  if (path === "/account/notifications") return "notifications";
  if (path === "/account/addresses") return "addresses";
  if (path === "/account/info") return "info";
  return "collection";
}

export function sectionAfterPop(
  state: unknown,
  fallback: ProfileSection,
): ProfileSection {
  if (!state || typeof state !== "object" || !("profileSection" in state)) {
    return fallback;
  }
  const section = (state as { profileSection: unknown }).profileSection;
  return isProfileSection(section) ? section : fallback;
}
