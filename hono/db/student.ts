import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { Interests, Socials } from "../types";

export const student = sqliteTable("student", {
  email: text("email").primaryKey(),
  name: text("name").notNull(),
  gender: text("gender", { enum: ["male", "female", "other"] }),
  jmc: integer("jmc", { mode: "boolean" }),
  socials: text("socials", { mode: "json" }).$type<Socials>(),
  interests: text("interests", { mode: "json" }).$type<Interests>(),
});
