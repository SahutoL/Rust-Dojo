import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prismaPool: pg.Pool | undefined;
  prisma: PrismaClient | undefined;
};

function isLocalDevelopmentDatabase(connectionString: string) {
  try {
    const url = new URL(connectionString);
    return (
      process.env.NODE_ENV !== "production" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

function parsePoolNumber(name: string, fallback: number) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function createPgPool() {
  const connectionString = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DIRECT_DATABASE_URL or DATABASE_URL is not set");
  }

  const isLocalDevDatabase = isLocalDevelopmentDatabase(connectionString);
  const defaultMax = isLocalDevDatabase
    ? 1
    : process.env.NODE_ENV === "production"
      ? 12
      : 8;
  const defaultConnectionTimeout = isLocalDevDatabase ? 10_000 : 3_000;
  const defaultIdleTimeout = isLocalDevDatabase ? 5_000 : 30_000;

  return new pg.Pool({
    connectionString,
    max: parsePoolNumber("PG_POOL_MAX", defaultMax),
    idleTimeoutMillis: parsePoolNumber(
      "PG_POOL_IDLE_TIMEOUT_MS",
      defaultIdleTimeout
    ),
    connectionTimeoutMillis: parsePoolNumber(
      "PG_POOL_CONNECTION_TIMEOUT_MS",
      defaultConnectionTimeout
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
