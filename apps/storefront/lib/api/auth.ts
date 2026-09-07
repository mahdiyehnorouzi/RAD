import type {AuthUser} from "@rad/types";
import type {LoginInput, RegisterInput, SessionPayload} from "@/types/api";
import { api } from "./client";

export type { LoginInput, RegisterInput, SessionPayload };

export async function fetchSession() {
  return api<SessionPayload>("/auth/me");
}

export async function createSession(input: LoginInput) {
  return api<{ user: AuthUser }>("/auth/session", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function registerAccount(input: RegisterInput) {
  return api<{ user: AuthUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function logoutSession() {
  await api("/auth/logout", { method: "POST" });
}

export async function requestPasswordReset(email: string) {
  return api<{ message: string }>("/auth/password/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetAccountPassword(input: {
  email: string;
  code: string;
  password: string;
}) {
  return api<{ ok: boolean }>("/auth/password/reset", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
