import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

const PARTNERS = [
  { name: "Marce", email: "garridomarcex@gmail.com", role: Role.OWNER, passwordEnv: "SEED_PASSWORD_MARCE" },
  { name: "Lautaro", email: "lautarooyt837@gmail.com", role: Role.OWNER, passwordEnv: "SEED_PASSWORD_LAUTARO" },
];

async function seedUsers() {
  for (const partner of PARTNERS) {
    const existing = await prisma.user.findUnique({ where: { email: partner.email } });

    if (existing) {
      await prisma.user.update({
        where: { email: partner.email },
        data: { name: partner.name, role: partner.role },
      });
      console.log(`✔ Usuario existente actualizado: ${partner.email}`);
      continue;
    }

    const password = process.env[partner.passwordEnv];
    if (!password || password.length < 8) {
      throw new Error(`Falta ${partner.passwordEnv} (mínimo 8 caracteres) para crear ${partner.email}`);
    }

    await prisma.user.create({
      data: {
        name: partner.name,
        email: partner.email,
        role: partner.role,
        password: await bcrypt.hash(password, 12),
      },
    });
    console.log(`✔ Usuario creado: ${partner.email}`);
  }
}

seedUsers()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
