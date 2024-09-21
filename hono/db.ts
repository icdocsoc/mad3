import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import fs from 'node:fs';

export const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDB,
  password: process.env.PGPASSWORD,
  port: +(process.env.PGPORT || 5432),
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(process.env.PGCERT_PATH || '').toString()
  }
});

export const db = drizzle(pool);
