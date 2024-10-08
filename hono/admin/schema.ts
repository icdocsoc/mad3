import { sql } from 'drizzle-orm';
import { pgTable, integer, pgEnum, text, timestamp } from 'drizzle-orm/pg-core';
import { stateOptions } from '../types';

export const appState = pgEnum('app_state', stateOptions);

// Hacky way to ensure that there is only one row until Drizzle implements .check().
// https://github.com/drizzle-team/drizzle-orm/issues/880#issuecomment-1814869720
export const meta = pgTable('meta', {
  id: integer('id')
    .primaryKey()
    .default(sql`1 CHECK (id = 1)`),
  state: appState('state').notNull()
});

export const states = pgTable('states', {
  state: text('string').primaryKey(),
  expiresAt: timestamp('expires_at').notNull()
});
