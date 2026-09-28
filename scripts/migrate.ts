// Brings the database up to date with the migrations in drizzle/, using the same connection
// settings as the app. Run it before starting the server; the Docker image does.
//
// A database made before this script existed (by `drizzle-kit push` or compose's first-start
// scripts) has no record of what ran, so its first run replays every migration. They are
// written to be safe to replay.
import { migrate } from 'drizzle-orm/bun-sql/migrator';
import { db, pool } from '../hono/db';

await migrate(db, { migrationsFolder: 'drizzle' });
await pool.close();
console.log('Migrations applied.');
