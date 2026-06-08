import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env.js";

if (!env.databaseUrl) {
  throw new Error("DATABASE_URL chưa được cấu hình trong .env");
}

const adapter = new PrismaPg({ connectionString: env.databaseUrl });
const prisma = new PrismaClient({ adapter });

export async function connectDB() {
  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;
  console.log("✅ PostgreSQL connected");
}

export async function disconnectDB() {
  await prisma.$disconnect();
}

export default prisma;
