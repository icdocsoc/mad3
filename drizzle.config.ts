import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  out: './hono/schema',
  schema: './hono/**/schema.ts',
  dbCredentials: {
    host: process.env.PGHOST || '',
    user: process.env.PGUSER || '',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDB || ''
  }
});
