import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { auth } from "./auth";

export type Socials = {
  twitter: string;
  tiktok: string;
  discord: string;
  instagram: string;
  spotify: string;
};

const interestKeys = [
  "alcohol",
  "anime",
  "artGraphics",
  "baking",
  "charity",
  "clubbing",
  "cooking",
  "danceBallroom",
  "danceContemporary",
  "dramatics",
  "exerciseAndHealth",
  "film",
  "finance",
  "football",
  "hiking",
  "kpop",
  "martialArts",
  "otherSports",
  "performingMusicClassical",
  "performingMusicPopRockJazz",
  "photography",
  "politics",
  "racketSports",
  "rowing",
  "rugby",
  "tabletopGames",
  "videoGames",
] as const;
export type Interests = Record<(typeof interestKeys)[number], 0 | 1 | 2 | 3>;

export const student = sqliteTable("student", {
  email: text("email")
    .references(() => auth.email)
    .primaryKey(),
  name: text("name").notNull(),
  gender: text("gender", { enum: ["male", "female", "other"] }),
  jmc: integer("jmc", { mode: "boolean" }),
  socials: text("socials", { mode: "json" }).$type<Socials>(),
  interests: text("interests", { mode: "json" }).$type<Interests>(),
});
