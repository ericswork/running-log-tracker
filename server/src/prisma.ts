import "dotenv/config";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "./generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Check server/.env.");
}

// Prisma 7 has no built-in query engine — it talks to SQLite through a driver adapter.
const adapter = new PrismaBetterSqlite3({ url: databaseUrl });

// Reuse a single PrismaClient across the process. The global cache prevents
// new connections from piling up when the dev server restarts / re-imports.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
