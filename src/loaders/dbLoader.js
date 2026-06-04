import { PrismaClient } from "@prisma/client";
import "dotenv/config";     

import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const connectDB = async () => {
    try {
        await prisma.$connect();
        // Kiểm tra kết nối bằng truy vấn đơn giản
        await prisma.$queryRaw`SELECT 1`;
        console.log("✅ Kết nối PostgreSQL thành công!");
    } catch (error) {
        console.error("❌ Lỗi kết nối Database:", error.message);
        process.exit(1);
    }
};

export default prisma;
