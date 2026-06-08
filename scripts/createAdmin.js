import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import prisma, { disconnectDB } from "../src/loaders/dbLoader.js";
import { hashText } from "../src/helpers/security.js";

const rl = readline.createInterface({ input, output });

async function main() {
  const fullName = process.env.ADMIN_FULL_NAME || await rl.question("Admin full name: ");
  const phoneNumber = process.env.ADMIN_PHONE_NUMBER || await rl.question("Admin phone number: ");
  const email = process.env.ADMIN_EMAIL || await rl.question("Admin email: ");
  const password = process.env.ADMIN_PASSWORD || await rl.question("Admin password: ");

  const passwordHash = await hashText(password);

  const admin = await prisma.user.upsert({
    where: { phoneNumber },
    create: { fullName, phoneNumber, email, passwordHash, role: "admin" },
    update: { fullName, email, passwordHash, role: "admin", isActive: true },
    select: { userId: true, fullName: true, phoneNumber: true, email: true, role: true },
  });

  console.log("Admin ready:", admin);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    rl.close();
    await disconnectDB();
  });
