import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Upserts the owner + editor accounts without reseeding catalog media.
 * Safe to run on every API boot so production always has a usable admin login.
 */
export async function ensureStaff(client: PrismaClient = prisma) {
  const adminEmail = (process.env.ADMIN_EMAIL ?? "mahdiyeh.norozi77@gmail.com").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? "rad-studio-owner";
  const passwordHash = await hash(adminPassword, 12);

  await client.user.upsert({
    where: { email: adminEmail },
    update: {
      name: "مهدیه نوروزی",
      passwordHash,
      role: "admin",
      adminRole: "owner",
      status: "active",
    },
    create: {
      name: "مهدیه نوروزی",
      email: adminEmail,
      passwordHash,
      role: "admin",
      adminRole: "owner",
      status: "active",
    },
  });

  const editorHash = await hash("rad-editor-2026", 12);
  await client.user.upsert({
    where: { email: "sahar@rad.studio" },
    update: {
      name: "سحر میرزایی",
      passwordHash: editorHash,
      role: "artist",
      adminRole: "editor",
      status: "active",
    },
    create: {
      name: "سحر میرزایی",
      email: "sahar@rad.studio",
      passwordHash: editorHash,
      role: "artist",
      adminRole: "editor",
      status: "active",
    },
  });

  return { adminEmail };
}

async function main() {
  const { adminEmail } = await ensureStaff();
  console.log(`Staff ensured. Owner email: ${adminEmail}`);
}

if (require.main === module) {
  main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
