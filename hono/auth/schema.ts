import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';
import { shortcodeEmailRegex } from '../types';

/**
 * The code emailed to someone signing in. One per address: asking again replaces it. Only a
 * hash is kept, so a leaked table cannot be used to sign in.
 */
export const loginCodes = pgTable('login_codes', {
  email: text('email').primaryKey(),
  codeHash: text('code_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
  attempts: integer('attempts').notNull().default(0)
});

/** A shortcode email, forgiving the capitals and spaces phones like to add. */
const shortcodeEmail = z
  .string()
  .trim()
  .toLowerCase()
  .regex(shortcodeEmailRegex);

export const loginSchema = z.object({ email: shortcodeEmail });

export const verifySchema = z.object({
  email: shortcodeEmail,
  // People paste codes with spaces in, e.g. "123 456".
  code: z
    .string()
    .transform(code => code.replace(/\s/g, ''))
    .pipe(z.string().regex(/^\d{6}$/))
});
