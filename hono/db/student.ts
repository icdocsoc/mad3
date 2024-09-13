import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { Interests } from "../types";

export const student = sqliteTable("student", {
  shortcode: text("shortcode").primaryKey(),
  email: text("email"),
  name: text("name").notNull(),
  gender: text("gender", { enum: ["male", "female", "other", "n/a"] }),
  jmc: integer("jmc", { mode: "boolean" }),
  socials: text("socials", { mode: "json" }),
  interests: text("interests", { mode: "json" }).$type<Interests>(),
});
