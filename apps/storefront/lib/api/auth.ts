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

export async function changeAccountPassword(input: {
  currentPassword: string;
  newPassword: string;
}) {
  return api<{ ok: boolean }>("/auth/password", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
