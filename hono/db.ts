import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

const database = new Database("db.sqlite", { create: true, strict: true });
const db = drizzle(database)

const auth = sqliteTable("auth", {
    email: text('email').primaryKey(),
    accessToken: text('access_token').notNull(),
    refreshToken: text('refresh_token').notNull(),
    expiresAt: text('expires_at').notNull()
}) 

const student = sqliteTable("student", {
    email: text('email').references(auth.email),

})

db.exec(
  `PRAGMA foreign_keys = ON;
   CREATE TABLE IF NOT EXISTS auth (email TEXT PRIMARY KEY, access_token TEXT NOT NULL, refresh_token TEXT NOT NULL, expires_at TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS student (FOREIGN KEY(email) REFERENCES auth(email), name TEXT NOT NULL, gender TEXT NOT NULL CHECK (text IN 'M', 'F', 'O'), jmc BOOLEAN NOT NULL, )`
);

const addOrUpdateAuthDb = db.prepare(
  `INSERT INTO auth(email, access_token, refresh_token, expires_at) VALUES ($email, $access_token, $refresh_token, $expires_at)
    ON CONFLICT (auth.email) DO UPDATE SET access_token=excluded.access_token, refresh_token=excluded.refresh_token, expires_at=excluded.expires_at `
);

/* This is wrapped in a function to prevent 
    1) running with no params, which defaults to the last params
    2) forgetting to use date.toISOString() 
*/
export const addOrUpdateAuth = (
  email: string,
  access_token: string,
  refresh_token: string,
  expires_at: Date
) => {
  addOrUpdateAuthDb.run(
    email,
    access_token,
    refresh_token,
    expires_at.toISOString()
  );
};

export default db;
