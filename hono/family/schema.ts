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
import {
  chipKeys,
  commuteOptions,
  drinkingOptions,
  lateNightsOptions,
  meetingPeopleOptions,
  societiesOptions,
  valuesOf
} from '../survey';

export const studentRole = pgEnum('student_role', studentRoles);
export const gender = pgEnum('gender', genderOptions);
export const commute = pgEnum('commute', valuesOf(commuteOptions));
export const drinking = pgEnum('drinking', valuesOf(drinkingOptions));
export const lateNights = pgEnum('late_nights', valuesOf(lateNightsOptions));
export const societies = pgEnum('societies', valuesOf(societiesOptions));
export const meetingPeople = pgEnum(
  'meeting_people',
  valuesOf(meetingPeopleOptions)
);

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
  // Links from the old survey. New answers use the contact columns below.
  socials: text('socials').array(),
  aboutMe: text('about_me'),
  preferredName: text('preferred_name'),
  // What someone who picked "I am..." wrote; gender is then `other`.
  genderDescription: text('gender_description'),
  commute: commute('commute'),
  drinking: drinking('drinking'),
  lateNights: lateNights('late_nights'),
  societies: societies('societies'),
  meetingPeople: meetingPeople('meeting_people'),
  instagram: text('instagram'),
  discord: text('discord'),
  phone: text('phone')
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

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform(text => text || null)
    .nullable()
    .optional()
    .transform(text => text ?? null);

/**
 * What the survey page sends. The same for freshers and parents, and editable until sign-ups
 * close. `interests` holds the chips only; the allocator's full set is built from it on save.
 */
export const surveySchema = z.object({
  name: z.string().trim().min(1).max(100),
  preferredName: optionalText(100),
  jmc: z.boolean(),
  commute: z.enum(valuesOf(commuteOptions)),
  gender: z.enum(genderOptions).nullable(),
  genderDescription: optionalText(100),
  drinking: z.enum(valuesOf(drinkingOptions)),
  lateNights: z.enum(valuesOf(lateNightsOptions)),
  interests: z
    .object(
      Object.fromEntries(
        chipKeys.map(key => [
          key,
          z.union([z.literal(0), z.literal(1), z.literal(2)])
        ])
      ) as unknown as Record<(typeof chipKeys)[number], z.ZodType<0 | 1 | 2>>
    )
    .refine(chips => Object.values(chips).some(score => score > 0), {
      message: 'Pick at least one interest.'
    }),
  societies: z.enum(valuesOf(societiesOptions)),
  meetingPeople: z.enum(valuesOf(meetingPeopleOptions)),
  aboutMe: optionalText(1000),
  // Handles, not links: people type "@name", and the page shows them as they were typed.
  instagram: optionalText(60).transform(
    handle => handle?.replace(/^@/, '') || null
  ),
  discord: optionalText(60),
  phone: optionalText(30)
});
