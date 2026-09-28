import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './hono/**/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  // The same variables the app connects with, so drizzle-kit commands reach the same database.
  dbCredentials: {
    host: process.env.PGHOST!,
    port: +(process.env.PGPORT || 5432),
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDB!,
    ssl: process.env.PGCA ? { ca: process.env.PGCA } : false
  },
  verbose: true
});
