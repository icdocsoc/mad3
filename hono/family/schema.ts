import {
  integer,
  primaryKey,
  sqliteTable,
  text
} from 'drizzle-orm/sqlite-core';
import { type Interests, genderOptions, interestKeys } from '../types';
import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';

export const proposals = sqliteTable(
  'proposals',
  {
    proposer: text('proposer')
      .references(() => students.shortcode)
      .notNull(),
    proposee: text('proposee')
      .references(() => students.shortcode)
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

export const students = sqliteTable('student', {
  shortcode: text('shortcode').primaryKey(),
  role: text('role', { enum: ['parent', 'fresher'] }).notNull(),
  completedSurvey: integer('completed_survey', { mode: 'boolean' }).notNull(),
  jmc: integer('jmc', { mode: 'boolean' }),
  name: text('name'),
  gender: text('gender', { enum: genderOptions }),
  interests: text('interests', { mode: 'json' }).$type<Interests>(),
  socials: text('socials', { mode: 'json' }).$type<string[]>(),
  aboutMe: text('about_me')
});

// Interest schema, but as a zod object.
export const interestsSchema = z.object(
  Object.fromEntries(
    interestKeys.map(key => [
      key,
      z.union([z.literal(0), z.literal(1), z.literal(2)])
    ])
  )
);

// Nullable makes it play nice with the createSchema/db select types
export const selectStudentSchema = createSelectSchema(students).extend({
  interests: interestsSchema.nullable(),
  socials: z.array(z.string()).nullable()
});

// here we remove some things and make some things non optional.
export const surveySchema = selectStudentSchema
  .omit({
    shortcode: true,
    role: true,
    completedSurvey: true
  })
  .extend({
    name: z.string(),
    jmc: z.boolean(),
    gender: z.enum(genderOptions),
    interests: interestsSchema
  });
