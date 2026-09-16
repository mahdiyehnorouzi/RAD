import { hash } from "bcryptjs";
import type { DataSource } from "typeorm";
import { createAppDataSource } from "../src/database/data-source";
import { User } from "../src/database/entities";

/**
 * Upserts the owner + editor accounts without reseeding catalog media.
 * Safe to run on every API boot so production always has a usable admin login.
 */
export async function ensureStaff(dataSource: DataSource) {
  const users = dataSource.getRepository(User);
  const adminEmail = (process.env.ADMIN_EMAIL ?? "mahdiyeh.norozi77@gmail.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "rad-studio-owner";
  const passwordHash = await hash(adminPassword, 12);

  const owner = await users.findOne({ where: { email: adminEmail } });
  if (owner) {
    await users.update(
      { id: owner.id },
      {
        name: "مهدیه نوروزی",
        passwordHash,
        role: "admin",
        adminRole: "owner",
        status: "active",
      },
    );
  } else {
    await users.save(
      users.create({
        name: "مهدیه نوروزی",
        email: adminEmail,
        passwordHash,
        role: "admin",
        adminRole: "owner",
        status: "active",
      }),
    );
  }

  const editorHash = await hash("rad-editor-2026", 12);
  const editorEmail = "sahar@rad.studio";
  const editor = await users.findOne({ where: { email: editorEmail } });
  if (editor) {
    await users.update(
      { id: editor.id },
      {
        name: "سحر میرزایی",
        passwordHash: editorHash,
        role: "artist",
        adminRole: "editor",
        status: "active",
      },
    );
  } else {
    await users.save(
      users.create({
        name: "سحر میرزایی",
        email: editorEmail,
        passwordHash: editorHash,
        role: "artist",
        adminRole: "editor",
        status: "active",
      }),
    );
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
