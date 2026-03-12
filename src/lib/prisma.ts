import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prismaPool: pg.Pool | undefined;
  prisma: PrismaClient | undefined;
};

function parsePoolNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function createPgPool() {
  const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DIRECT_DATABASE_URL or DATABASE_URL is not set");
  }

  return new pg.Pool({
    connectionString,
    max: parsePoolNumber(
      "PG_POOL_MAX",
      process.env.NODE_ENV === "production" ? 12 : 8
    ),
    idleTimeoutMillis: parsePoolNumber("PG_POOL_IDLE_TIMEOUT_MS", 30_000),
    connectionTimeoutMillis: parsePoolNumber(
      "PG_POOL_CONNECTION_TIMEOUT_MS",
      3_000
    ),
    keepAlive: true,
  });
}

const prismaPool = globalForPrisma.prismaPool ?? createPgPool();

function createPrismaClient(pool: pg.Pool): PrismaClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any);
  return new PrismaClient({ adapter }) as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient(prismaPool);

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaPool = prismaPool;
  globalForPrisma.prisma = prisma;
}

export type { PrismaClient };
export * from "../generated/prisma/enums";
