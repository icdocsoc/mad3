import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './hono/admin/schema.ts',
  dialect: 'postgresql',
  verbose: true
});
