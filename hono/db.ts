import { sql } from 'drizzle-orm';
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

/**
 * A value for a `json` column. With Bun's driver, Drizzle's own encoding stores objects as a
 * JSON *string* (`"{\"a\":1}"`): the app reads them back fine, but the database, and anything
 * querying it directly, sees text. Casting through text stores a real JSON object.
 */
export const asJson = (value: unknown) =>
  sql`${JSON.stringify(value)}::text::json`;
