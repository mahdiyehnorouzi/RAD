import { randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import type { DataSource, Repository } from "typeorm";
import { createAppDataSource } from "../src/database/data-source";
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

async function upsertStaff(
  users: Repository<User>,
  account: StaffAccount,
  password: string,
) {
  const passwordHash = await hash(password, 12);
  const existing = await users.findOne({ where: { email: account.email } });
  const fields = { ...account, passwordHash, status: "active" };
  if (existing) await users.update({ id: existing.id }, fields);
  else await users.save(users.create(fields));
}

/** Replaces a password that matches the public dev default with an unknowable one. */
async function lockPublicPassword(
  users: Repository<User>,
  email: string,
  publicPassword: string,
) {
  const existing = await users.findOne({ where: { email } });
  if (!existing || !(await compare(publicPassword, existing.passwordHash)))
    return false;
  await users.update(
    { id: existing.id },
    { passwordHash: await hash(randomBytes(32).toString("hex"), 12) },
  );
  return true;
}

/**
 * Upserts the owner + editor accounts without reseeding catalog media.
 * Runs on every production boot: ADMIN_PASSWORD / EDITOR_PASSWORD are the
 * source of truth, and an unset password leaves that account untouched.
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
