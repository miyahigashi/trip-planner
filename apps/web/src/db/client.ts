// apps/web/src/db/client.ts
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
    // statement_timeout: 5000,            // 任意: 長いクエリ検知
  });

// ← プールのエラーは落ちやすいのでログ
pool.on("error", (err) => {
  console.error("[db] pool error:", err);
});

const enableSqlLog = process.env.DEBUG_SQL === "1"; // ← 環境変数で制御

const db =
  globalForDb._db ??
  drizzle(pool, {
    schema,
    logger: enableSqlLog, // ← これで実行SQL＋パラメータが出ます
    // logger: {
    //   logQuery(query, params) {
    //     console.log("[sql]", query, params);
    //   },
    // }, // 細かく整形したい場合はオブジェクトで
  });

if (!globalForDb._pool) globalForDb._pool = pool;
if (!globalForDb._db) globalForDb._db = db;

export { db };
export type Db = typeof db;
