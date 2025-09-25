import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { z } from 'zod';

export const tokens = pgTable('tokens', {
  token: text('token').primaryKey(),
  email: text('email').notNull(),
  issuedAt: timestamp('issued_at').notNull(),
  expiresAt: timestamp('expires_at').notNull()
});

export const callbackSchema = z.object({
  code: z.string(),
  state: z.string(),
  error: z.string().optional(),
  error_description: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email()
});

export const emailCallbackSchema = z.object({
  token: z.string()
});
