import { APIRequestContext } from "@playwright/test";
import { API_BASE_URL } from "../fixtures/api";

/**
 * Logs an API request context in as an admin via POST /auth/session, then
 * sets request.adminRole-gated access for subsequent /admin/* calls.
 *
 * No admin seed user was located in apps/api/seed/*.ts during investigation
 * (see docs/qa/flow-inventory.md / bug-report.md) — AGENTS.md says not to
 * invent business rules or fixtures, so this does NOT hardcode a guessed
 * admin email/password. Instead it requires E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
 * env vars pointing at a real admin account (adminRole truthy, status
 * "active") on whatever environment the suite targets. Tests using this
 * helper will throw a clear, actionable error if those env vars are unset,
 * rather than silently skipping or fabricating a pass.
 */
export async function loginAsAdmin(api: APIRequestContext) {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD are not set. No admin seed user " +
        "was found in apps/api/seed/*.ts during this task's investigation, " +
        "so this test needs a real admin account's credentials supplied via " +
        "env vars rather than a guessed/hardcoded one.",
    );
  }
  const res = await api.post(`${API_BASE_URL}/auth/session`, {
    data: { email, password },
  });
  if (!res.ok()) {
    throw new Error(
      `Admin login failed (${res.status()}): ${await res.text()}`,
    );
  }
  return res.json();
}
