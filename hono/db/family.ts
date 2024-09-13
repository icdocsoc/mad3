import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { student } from "./student";

export const proposals = sqliteTable("proposals", {
  proposer: text("proposer")
    .references(() => student.shortcode)
    .primaryKey(),
  proposee: text("proposee")
    .references(() => student.shortcode)
    .notNull(),
});

export const marriage = sqliteTable("marriage", {
  id: text("id").primaryKey(),
  parent1: text("parent1")
    .references(() => student.shortcode)
    .notNull(),
  parent2: text("parent2")
    .references(() => student.shortcode)
    .notNull(),
  hasFemale: integer("has_female", { mode: "boolean" }).notNull(),
  hasJmc: integer("has_jmc", { mode: "boolean" }).notNull(),
});

export const family = sqliteTable("family", {
  kid: text("kid")
    .references(() => student.shortcode)
    .primaryKey(),
  id: text("id").references(() => marriage.id),
});
