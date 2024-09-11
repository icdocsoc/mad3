import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

const database = new Database("db.sqlite", { create: true, strict: true });
const db = drizzle(database);

export type Socials = {
  twitter: string;
  tiktok: string;
  discord: string;
  instagram: string;
  spotify: string;
};

const interestKeys = [
  "alcohol", "anime", "artGraphics", "baking",  "charity",  "clubbing",
  "cooking",  "danceBallroom",  "danceContemporary",  "dramatics",
  "exerciseAndHealth",  "film",  "finance",  "football",  "hiking",
  "kpop",  "martialArts",  "otherSports",  "performingMusicClassical",
  "performingMusicPopRockJazz",  "photography",  "politics",  "racketSports",
  "rowing",  "rugby",  "tabletopGames",  "videoGames"
] as const
export type Interests = Record<typeof interestKeys[number], 0 | 1 | 2 | 3>

export const auth = sqliteTable("auth", {
  email: text("email").primaryKey(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

export const student = sqliteTable("student", {
  email: text("email").references(() => auth.email),
  name: text("name").notNull(),
  gender: text("gender", { enum: ["male", "female", "other"] }).notNull(),
  jmc: integer("jmc", { mode: "boolean" }),
  socials: text("socials", { mode: "json" }).$type<Socials>(),
  interests: text('interests', { mode: 'json' }).$type<>();
});

export const parent = sqliteTable("parent", {
  email: text("email").references(() => student.email),
  interests:
});

export default db;
