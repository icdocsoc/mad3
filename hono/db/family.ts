import {
  integer,
  primaryKey,
  sqliteTable,
  text
} from 'drizzle-orm/sqlite-core';
import { students } from './student';

export const proposals = sqliteTable(
  'proposals',
  {
    proposer: text('proposer')
      .references(() => students.shortcode)
      .notNull(),
    proposee: text('proposee')
      .references(() => students.shortcode)
      .notNull()
      .notNull()
  },
  proposals => {
    return {
      pk: primaryKey({ columns: [proposals.proposer, proposals.proposee] })
    };
  }
);

export const marriages = sqliteTable('marriage', {
  id: integer('id').primaryKey(),
  parent1: text('parent1')
    .references(() => students.shortcode)
    .notNull()
    .unique(),
  parent2: text('parent2')
    .references(() => students.shortcode)
    .notNull()
    .unique()
  // hasFemale: integer('has_female', { mode: 'boolean' }).notNull(),
  // hasJmc: integer('has_jmc', { mode: 'boolean' }).notNull()
});

export const families = sqliteTable('family', {
  kid: text('kid')
    .references(() => students.shortcode)
    .primaryKey(),
  id: integer('id')
    .references(() => marriages.id)
    .notNull()
});
