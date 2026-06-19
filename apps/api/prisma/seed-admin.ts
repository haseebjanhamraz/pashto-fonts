import { PrismaClient, AdminRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("[Seed] Seeding default admin account...");

  const email = process.env.ADMIN_EMAIL || "admin@pashtofonts.com";
  const password = process.env.ADMIN_PASSWORD || "admin123";
  const name = process.env.ADMIN_NAME || "System Admin";

  const existingAdmin = await prisma.admin.findUnique({
    where: { email },
  });

  if (existingAdmin) {
    console.log(`[Seed] Admin user ${email} already exists.`);
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const admin = await prisma.admin.create({
    data: {
      name,
      email,
      passwordHash,
      role: AdminRole.SUPER_ADMIN,
    },
  });

  console.log(`[Seed] Seeded Admin User: ${admin.name} (${admin.email})`);
}

main()
  .catch((e) => {
    console.error("[Seed] Error seeding admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
