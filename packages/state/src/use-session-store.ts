import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthUser } from "@rad/types";

interface SessionState {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
}

export const useSessionStore = create<SessionState>()(
  persist((set) => ({ user: null, setUser: (user) => set({ user }) }), { name: "rad-session-v1" }),
);
