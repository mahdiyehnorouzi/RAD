"use client";

import { createContext, useContext } from "react";
import type { ProfileSection } from "./profile-section";

export const ProfileTabsContext = createContext<{
  section: ProfileSection;
  select: (section: ProfileSection) => void;
} | null>(null);

export function useProfileTabs() {
  return useContext(ProfileTabsContext);
}
