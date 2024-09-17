import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { stateOptions } from '../types';

// Hacky way to ensure that there is only one row until Drizzle implements .check().
// https://github.com/drizzle-team/drizzle-orm/issues/880#issuecomment-1814869720
export const meta = sqliteTable('meta', {
  id: integer('id')
    .primaryKey()
    .default(sql`1 CHECK (id = 1)`),
  state: text('state', {
    enum: stateOptions
  }).notNull()
});
