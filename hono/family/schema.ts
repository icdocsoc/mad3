import {
  integer,
  primaryKey,
  pgTable,
  text,
  boolean,
  json,
  jsonb,
  serial,
  pgEnum
} from 'drizzle-orm/pg-core';
import {
  type Interests,
  genderOptions,
  interestKeys,
  studentRoles
} from '../types';
import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';
import type { Answers } from '../survey/survey';

export const studentRole = pgEnum('student_role', studentRoles);
export const gender = pgEnum('gender', genderOptions);

export const proposals = pgTable(
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

export const marriages = pgTable('marriage', {
  id: serial('id').primaryKey(),
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

export const families = pgTable('family', {
  kid: text('kid')
    .references(() => students.shortcode)
    .primaryKey(),
  id: integer('id')
    .references(() => marriages.id)
    .notNull()
});

export const students = pgTable('student', {
  shortcode: text('shortcode').primaryKey(),
  role: studentRole('role').notNull(),
  completedSurvey: boolean('completed_survey').notNull(),
  jmc: boolean('jmc'),
  name: text('name'),
  gender: gender('gender'),
  // From the old survey, kept for past years' rows.
  interests: json('interests').$type<Interests>(),
  socials: text('socials').array(),
  aboutMe: text('about_me'),
  // Every answer to the survey, keyed as in hono/survey/mads.json. Only ever a complete,
  // checked submission: the matchmaker reads it.
  answers: jsonb('answers').$type<Answers>(),
  // The version of mads.json those answers were given to.
  surveyVersion: integer('survey_version'),
  // What has been typed since, saved as it happens so nothing is lost. Becomes `answers`
  // only when submitted.
  draft: jsonb('draft').$type<Answers>()
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
  socials: z.array(z.string()).nullable(),
  answers: z.record(z.union([z.string(), z.array(z.string())])).nullable(),
  draft: z.record(z.union([z.string(), z.array(z.string())])).nullable()
});

/** What the survey page sends: the answers, keyed as in hono/survey/mads.json. */
export const surveySchema = z.object({
  answers: z.record(z.string(), z.unknown())
});
