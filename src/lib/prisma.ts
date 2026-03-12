import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DIRECT_DATABASE_URL or DATABASE_URL is not set");
  }

  const pool = new pg.Pool({ connectionString });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter }) as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient };
export * from "@/generated/prisma/enums";
