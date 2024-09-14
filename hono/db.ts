import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import drizzleConfig from '../drizzle.config.json'
import { meta } from './admin/schema';

const database = new Database('db.sqlite', { create: true, strict: true });
const db = drizzle(database);
migrate(db, { migrationsFolder: drizzleConfig.out });
try {
  db.insert(meta).values({
    id: 1,
    state: 'parents_open'
  }).run()
} catch (e) {
  // This just means the meta row is already inserted,
  // so do nothing.
}

export default db;
