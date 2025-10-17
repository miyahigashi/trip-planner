// apps/web/src/db/client.ts
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@/db/schema"; // ★ パスを "@/db/schema" に統一

type DB = NodePgDatabase<typeof schema>; // ★ これがポイント

const globalForDb = globalThis as unknown as {
  _pool?: Pool;
  _db?: DB;                     // ★ Union を避ける
};

const pool =
  globalForDb._pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

pool.on("error", (err) => console.error("[db] pool error:", err));

const enableSqlLog = process.env.DEBUG_SQL === "1";

export const db: DB =
  globalForDb._db ??
  drizzle(pool, {
    schema,                     // ★ schema を渡す
    logger: enableSqlLog,
  });

if (!globalForDb._pool) globalForDb._pool = pool;
if (!globalForDb._db) globalForDb._db = db;
