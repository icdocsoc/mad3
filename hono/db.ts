import { drizzle } from 'drizzle-orm/bun-sql';
import { SQL } from 'bun';

const ca = process.env.PGCA;

export const pool = new SQL({
  adapter: 'postgres',
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDB,
  password: process.env.PGPASSWORD,
  port: +(process.env.PGPORT || 5432),
  ssl: ca
    ? {
        rejectUnauthorized: true,
        ca
      }
    : undefined
});

export const db = drizzle(pool);
