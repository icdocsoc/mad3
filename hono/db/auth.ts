import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const auth = sqliteTable("auth", {
  email: text("email").primaryKey(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});
