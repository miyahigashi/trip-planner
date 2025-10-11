import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  _pool?: Pool;
  _db?: ReturnType<typeof drizzle>;
};

const pool =
  globalForDb._pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // ssl: { rejectUnauthorized: false }, // 本番で必要なら
  });

const db =
  globalForDb._db ?? drizzle(pool, { schema });

if (!globalForDb._pool) globalForDb._pool = pool;
if (!globalForDb._db) globalForDb._db = db;

export { db };
export type Db = typeof db;
