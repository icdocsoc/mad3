import { Database } from "bun:sqlite";

const db = new Database("db.sqlite", { create: true, strict: true })

const res = db.query("CREATE TABLE IF NOT EXISTS ()")

export default db;