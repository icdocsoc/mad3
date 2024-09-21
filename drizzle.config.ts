import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './hono/**/schema.ts',
  dialect: 'postgresql',
  verbose: true
});
