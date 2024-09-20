import {
  integer,
  primaryKey,
  pgTable,
  text,
  boolean,
  json,
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

const studentRole = pgEnum('student_role', studentRoles);
const gender = pgEnum('gender', genderOptions);

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
  interests: json('interests').$type<Interests>(),
  socials: text('socials').array(),
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
    interests: interestsSchema,
    socials: z.array(z.string().url()).optional()
  });
