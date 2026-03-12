import "dotenv/config";
import { bootstrapContentFixtures } from "../src/lib/content-sync";
import { prisma } from "../src/lib/prisma";

async function main() {
  await bootstrapContentFixtures();
  console.log("Content fixtures bootstrapped.");
}

main()
  .catch((error) => {
    console.error("Content bootstrap failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
