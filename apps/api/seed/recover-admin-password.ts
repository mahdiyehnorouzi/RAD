import { hash } from "bcryptjs";
import { createAppDataSource } from "../src/database/data-source";
import { assertSafeScriptTarget } from "../src/database/safe-target";
import { User } from "../src/database/entities";

/**
 * Break-glass admin password recovery — use only when BOTH of these have
 * already failed:
 *   1. The admin has a working authenticated session and can use
 *      `PATCH /auth/password` (in-app "change password") themselves.
 *   2. The admin can receive email and can use the normal
 *      `POST /auth/password/forgot` → `POST /auth/password/reset` flow.
 *
 * This script sets exactly one account's password, chosen by the operator
 * out-of-band (never generated or printed here), and never touches any
 * other account or any other field. It requires three explicit,
 * independent confirmations so it can never run by accident:
 *   - `RAD_RECOVERY_EMAIL` must name the exact account to recover.
 *   - `RAD_RECOVERY_NEW_PASSWORD` must hold the new password the operator
 *     has already decided on (never echoed, logged, or stored anywhere
 *     but the hash written to the one row).
 *   - `RAD_RECOVERY_CONFIRM=yes-recover-${email}` must match the target
 *     email, so a copy-pasted env block from a previous recovery can't
 *     silently re-arm this for a different account.
 * It also goes through the same `assertSafeScriptTarget` host check every
 * other seed/ops script here uses, so it can't be pointed at a
 * shared/remote database by accident.
 *
 * Usage (run on the host that has DATABASE_URL for the real deploy):
 *   RAD_RECOVERY_EMAIL="owner@example.com" \
 *   RAD_RECOVERY_NEW_PASSWORD="$(read -rs -p 'New password: '; echo "$REPLY")" \
 *   RAD_RECOVERY_CONFIRM="yes-recover-owner@example.com" \
 *   npx tsx seed/recover-admin-password.ts
 *
 * Nothing here is wired into any automatic boot path — it must be invoked
 * by a human, deliberately, each time.
 */
async function main() {
  assertSafeScriptTarget("recover-admin-password.ts");

  const email = (process.env.RAD_RECOVERY_EMAIL ?? "").trim().toLowerCase();
  const newPassword = process.env.RAD_RECOVERY_NEW_PASSWORD ?? "";
  const confirm = process.env.RAD_RECOVERY_CONFIRM ?? "";

  if (!email) {
    throw new Error("Set RAD_RECOVERY_EMAIL to the account to recover.");
  }
  if (newPassword.length < 8) {
    throw new Error(
      "Set RAD_RECOVERY_NEW_PASSWORD to the new password (min 8 chars). " +
        "Choose it yourself; this script never generates or prints one.",
    );
  }
  if (confirm !== `yes-recover-${email}`) {
    throw new Error(
      `Set RAD_RECOVERY_CONFIRM="yes-recover-${email}" to confirm you intend ` +
        `to reset THIS account's password, and no other.`,
    );
  }

  const dataSource = createAppDataSource();
  await dataSource.initialize();
  try {
    const users = dataSource.getRepository(User);
    const user = await users.findOne({ where: { email } });
    if (!user) {
      throw new Error(`No account found for ${email}; nothing was changed.`);
    }
    if (!user.adminRole) {
      throw new Error(
        `${email} is not a staff account; this script only recovers staff ` +
          "logins. Nothing was changed.",
      );
    }

    const passwordHash = await hash(newPassword, 12);
    await users.update({ id: user.id }, { passwordHash, status: "active" });

    // Deliberately never logs the password or its hash — only confirms
    // which account and when, which is safe to appear in shell/process logs.
    console.log(
      `Password recovered for ${email} (user ${user.id}) at ${new Date().toISOString()}. ` +
        "Sign in with the password you just set, then rotate it again via " +
        "the in-app change-password screen once you're in.",
    );
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
