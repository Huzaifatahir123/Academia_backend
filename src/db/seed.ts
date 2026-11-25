
import "dotenv/config";
import argon2 from "argon2";
import { prisma } from "./prisma";

async function main() {
  // Development seed only
  if (process.env.NODE_ENV === "production") {
    throw new Error("Development seed cannot run in production.");
  }

  // 1. Create roles if they do not already exist
  const roles = ["ADMIN", "TEACHER", "STUDENT"];

  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }

  console.log("Roles initialized.");

  // 2. Find the Admin role
  const adminRole = await prisma.role.findUnique({
    where: { name: "ADMIN" },
  });

  if (!adminRole) {
    throw new Error("Admin role could not be found.");
  }

  // 3. Check whether an Admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: { roleId: adminRole.id },
  });

  if (existingAdmin) {
    console.log("Admin already exists. Skipping Admin creation.");
    return;
  }

  // 4. Read development Admin credentials
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const firstName = process.env.SEED_ADMIN_FIRST_NAME;
  const lastName = process.env.SEED_ADMIN_LAST_NAME;

  if (!email || !password || !firstName || !lastName) {
    throw new Error("Missing development Admin environment variables.");
  }

  // 5. Hash password using Argon2id
  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
  });

  // 6. Create initial Admin
  await prisma.user.create({
    data: {
      roleId: adminRole.id,
      firstName,
      lastName,
      email: email.trim().toLowerCase(),
      passwordHash,
      emailVerifiedAt: new Date(),
      status: "ACTIVE",
    },
  });

  console.log("Initial Admin created successfully.");
}

main()
  .catch((error) => {
    console.error("Database seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
