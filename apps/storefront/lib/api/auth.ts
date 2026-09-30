import { api } from "./client";

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
