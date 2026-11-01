import path from "node:path";
import { SCHEMA as schema } from "./schema";

type Row = Record<string, any>;
type Querier = (sql: string, params?: unknown[]) => Promise<Row[]>;

const g = globalThis as unknown as { __yapaDb?: Promise<Querier> };

async function connect(): Promise<Querier> {
  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query(schema);
    return async (sql, params = []) => (await pool.query(sql, params as any[])).rows;
  }
  // Desarrollo: Postgres embebido en .data/
  const { PGlite } = await import("@electric-sql/pglite");
  (await import("node:fs")).mkdirSync(path.join(process.cwd(), ".data"), { recursive: true });
  const db = new PGlite(path.join(process.cwd(), ".data", "pg"));
  await db.exec(schema);
  return async (sql, params = []) => (await db.query<Row>(sql, params as any[])).rows;
}

export async function q<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  g.__yapaDb ??= connect();
  const run = await g.__yapaDb;
  return (await run(sql, params)) as T[];
}

export async function one<T = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  return (await q<T>(sql, params))[0] ?? null;
}
