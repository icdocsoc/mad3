import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import drizzleConfig from '../drizzle.config.json'

const database = new Database('db.sqlite', { create: true, strict: true });
const db = drizzle(database);
migrate(db, { migrationsFolder: drizzleConfig.out });

export default db;
