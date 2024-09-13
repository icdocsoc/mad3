import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import type { Interests } from '../types';

export const student = sqliteTable('student', {
  shortcode: text('shortcode').primaryKey(),
  name: text('name').notNull(),
  gender: text('gender', { enum: ['male', 'female', 'other', 'n/a'] }),
  jmc: integer('jmc', { mode: 'boolean' }).notNull(),
  socials: text('socials', { mode: 'json' }),
  interests: text('interests', { mode: 'json' }).$type<Interests>()
});
