import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

const database = new Database("db.sqlite", { create: true, strict: true });
const db = drizzle(database);
migrate(db, { migrationsFolder: "./hono/drizzle" });

export default db;
