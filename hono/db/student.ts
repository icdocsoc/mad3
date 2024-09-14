import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { type Interests, genderOptions, interestKeys } from '../types';
import { z } from 'zod';
import { createSelectSchema } from 'drizzle-zod';

export const students = sqliteTable('student', {
  shortcode: text('shortcode').primaryKey(),
  jmc: integer('jmc', { mode: 'boolean' }).notNull(),
  role: text('role', { enum: ['parent', 'fresher'] }).notNull(),
  completedSurvey: integer('completed_survey', { mode: 'boolean' }).notNull(),
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
const selectStudentSchema = createSelectSchema(students).extend({
  interests: interestsSchema.nullable(),
  socials: z.array(z.string()).nullable()
})

// here we remove some things and make some things non optional.
export const surveySchema = selectStudentSchema.omit({
  shortcode: true,
  jmc: true,
  role: true,
  completedSurvey: true
}).extend({
  name: z.string(),
  gender: z.enum(genderOptions),
  interests: interestsSchema
})
// export type Student = z.infer<typeof selectStudentSchema>