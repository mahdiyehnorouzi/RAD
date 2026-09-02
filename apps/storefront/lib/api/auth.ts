import type {AuthUser} from "@rad/types";
import type {LoginInput, SessionPayload} from "@/types/api";
import { api } from "./client";

export type { LoginInput, SessionPayload };

export async function fetchSession() {
  return api<SessionPayload>("/auth/me");
}

export async function createSession(input: LoginInput) {
  return api<{ user: AuthUser }>("/auth/session", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logoutSession() {
  await api("/auth/logout", { method: "POST" });
}
