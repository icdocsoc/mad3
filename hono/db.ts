import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

export const pool = new Pool({
  user: Bun.env.PG_USER,
  host: Bun.env.PG_HOST,
  database: Bun.env.PG_DB,
  password: Bun.env.PG_PASSWORD,
  port: +(Bun.env.PG_PORT || 5432)
});

export const db = drizzle(pool);
