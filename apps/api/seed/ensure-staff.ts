import { randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import type { DataSource, Repository } from "typeorm";
import { createAppDataSource } from "../src/database/data-source";
import { assertSafeScriptTarget } from "../src/database/safe-target";
import { User } from "../src/database/entities";

type StaffAccount = {
  email: string;
  name: string;
  role: "admin" | "artist";
  adminRole: "owner" | "editor";
};

/** Local-only logins. They are public in this repo, so production never applies them. */
const DEV_LOGINS = {
  owner: { email: "mahdiyeh.norozi77@gmail.com", password: "rad-studio-owner" },
  editor: { email: "sahar@rad.studio", password: "rad-editor-2026" },
} as const;

/**
 * Creates the staff account with the configured bootstrap password on first
 * boot only. On every later boot the account already exists, so its
 * `passwordHash` is never touched here — otherwise a real admin changing
 * their password through the app would get silently logged out of their
 * own, deliberately-chosen password on the next deploy/restart, since
 * `ADMIN_PASSWORD` / `EDITOR_PASSWORD` typically stay fixed in the
 * deployment's env across many boots. Non-security fields (name, role,
 * adminRole, status) still get upserted every boot, same as before.
 */
async function upsertStaff(
  users: Repository<User>,
  account: StaffAccount,
  password: string,
) {
  const existing = await users.findOne({ where: { email: account.email } });
  if (existing) {
    await users.update({ id: existing.id }, account);
    return;
  }
  const passwordHash = await hash(password, 12);
  await users.save(
    users.create({ ...account, passwordHash, status: "active" }),
  );
}

/** Replaces a password that matches the public dev default with an unknowable one. */
export async function lockPublicPassword(
  users: Repository<User>,
  email: string,
  publicPassword: string,
) {
  const existing = await users.findOne({ where: { email } });
  if (
    !existing ||
    !existing.passwordHash ||
    !(await compare(publicPassword, existing.passwordHash))
  )
    return false;
  await users.update(
    { id: existing.id },
    { passwordHash: await hash(randomBytes(32).toString("hex"), 12) },
  );
  return true;
}

/**
 * Upserts the owner + editor accounts without reseeding catalog media.
 * Runs on every production boot. `ADMIN_PASSWORD` / `EDITOR_PASSWORD` set
 * the password only when the account doesn't exist yet (first boot ever,
 * or after a DB reset) — an unset password, or an already-existing
 * account, leaves the stored password hash untouched. To change an
 * existing admin's password, use the in-app "change password"/"forgot
 * password" flow, not this env var; see `seed/recover-admin-password.ts`
 * for the break-glass procedure when neither is possible.
 */
export async function ensureStaff(dataSource: DataSource) {
  const users = dataSource.getRepository(User);
  const production = process.env.NODE_ENV === "production";
  const password = (configured: string | undefined, dev: string) =>
    configured || (production ? undefined : dev);

  const adminEmail = (
    process.env.ADMIN_EMAIL ?? DEV_LOGINS.owner.email
  ).toLowerCase();
  const adminPassword = password(
    process.env.ADMIN_PASSWORD,
    DEV_LOGINS.owner.password,
  );
  if (adminPassword) {
    await upsertStaff(
      users,
      {
        email: adminEmail,
        name: "مهدیه نوروزی",
        role: "admin",
        adminRole: "owner",
      },
      adminPassword,
    );
  }

  const editorEmail = (
    process.env.EDITOR_EMAIL ?? DEV_LOGINS.editor.email
  ).toLowerCase();
  const editorPassword = password(
    process.env.EDITOR_PASSWORD,
    DEV_LOGINS.editor.password,
  );
  if (editorPassword) {
    await upsertStaff(
      users,
      {
        email: editorEmail,
        name: "سحر میرزایی",
        role: "artist",
        adminRole: "editor",
      },
      editorPassword,
    );
  }

  if (production) {
    for (const login of Object.values(DEV_LOGINS)) {
      if (await lockPublicPassword(users, login.email, login.password)) {
        console.warn(
          `${login.email} had a public default password and is now locked; use password reset to sign in.`,
        );
      }
    }
  }

  return { adminEmail };
}

async function main() {
  // Legitimate ops runs (e.g. bootstrapping the owner account against a
  // real deploy) are still possible — they just have to name the host
  // explicitly via RAD_ALLOW_REMOTE_DB_WRITE instead of relying on
  // whatever DATABASE_URL happens to be set to.
  assertSafeScriptTarget("db:ensure-staff");
  const dataSource = createAppDataSource();
  await dataSource.initialize();
  try {
    const { adminEmail } = await ensureStaff(dataSource);
    console.log(`Staff ensured. Owner email: ${adminEmail}`);
  } finally {
    await dataSource.destroy();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
