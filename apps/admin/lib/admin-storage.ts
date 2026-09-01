const REMEMBERED_EMAIL_KEY = "rad.admin.remembered-email";
const REMEMBER_ME_KEY = "rad.admin.remember-me";

export function loadRememberedEmail() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
}

export function loadRememberMe() {
  if (typeof window === "undefined") return true;
  const value = window.localStorage.getItem(REMEMBER_ME_KEY);
  return value !== "false";
}

export function saveLoginPreferences(email: string, rememberMe: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? "true" : "false");
  if (rememberMe && email.trim()) {
    window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email.trim());
  } else {
    window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  }
}
