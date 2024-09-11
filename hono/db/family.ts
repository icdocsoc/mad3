import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { student } from "./student";

export const proposals = sqliteTable("proposals", {
  proposer: text("email")
    .references(() => student.email)
    .primaryKey(),
  proposee: text("email")
    .references(() => student.email)
    .notNull(),
});

export const marriage = sqliteTable("marriage", {
  id: text("id").primaryKey(),
  parent1: text("email")
    .references(() => student.email)
    .notNull(),
  parent2: text("email")
    .references(() => student.email)
    .notNull(),
  hasFemale: integer("has_female", { mode: "boolean" }).notNull(),
  hasJmc: integer("has_jmc", { mode: "boolean" }).notNull(),
});

export const family = sqliteTable("family", {
  kid: text("kid")
    .references(() => student.email)
    .primaryKey(),
  id: text("id").references(() => marriage.id),
});
