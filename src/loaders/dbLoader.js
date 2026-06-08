import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing DATABASE_URL. Vui lòng cấu hình DATABASE_URL trong file .env");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({
  adapter,
  log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
});

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) return prisma;

  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    isConnected = true;
    console.log("✅ Kết nối PostgreSQL thành công!");
    return prisma;
  } catch (error) {
    console.error("❌ Lỗi kết nối Database:", error.message);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  if (!isConnected) return;
  await prisma.$disconnect();
  isConnected = false;
};

process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await disconnectDB();
  process.exit(0);
});

export default prisma;
