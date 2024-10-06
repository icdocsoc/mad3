import { zValidator } from '@hono/zod-validator';
import { grantAccessTo } from '../auth/jwt';
import { db } from '../db';
import factory from '../factory';
import {
  stateOptions,
  type AllocatorFamily,
  type AllocatorFresher,
  type AllocatorGender,
  type AllocatorParent,
  type Interests,
  type State,
  type Student
} from '../types';
import { meta } from './schema';
import { z } from 'zod';
import { aliasedTable, and, count, eq, isNull } from 'drizzle-orm';
import { families, marriages, students } from '../family/schema';
import { apiLogger } from '../logger';

export const requireState = (...states: [State, ...State[]]) =>
  factory.createMiddleware(async (ctx, next) => {
    const settings = await db.select().from(meta);
    const currState = settings[0]!.state;

    if (!states.includes(currState)) {
      return ctx.text(
        'It is not yet time to use this route, but I appreciate your enthusiasm.',
        403
      );
    }

    return await next();
  });

const allocationsSchema = z.array(
  z.object({
    fresher: z.string(),
    family: z.number()
  })
);

/* Note that allocation code is very strictly written to match the mad2 python allocator.
  I'm well aware it's not the prettiest; maybe eventually someone will rewrite the allocator,
  but for now, it does some nice allocating with interests.
*/
export const admin = factory
  .createApp()
  .get('/state', async ctx => {
    const settings = await db.select().from(meta);
    const currState = settings[0]!.state;

    return ctx.json(
      {
        state: currState
      },
      200
    );
  })
  .put(
    '/state',
    grantAccessTo('admin'),
    zValidator(
      'json',
      z.object({
        state: z.enum(stateOptions)
      }),
      async (zRes, ctx) => {
        if (!zRes.success) {
          return ctx.text('You know better, Jay and Nishant.', 400);
        }
      }
    ),
    async ctx => {
      const { state } = ctx.req.valid('json');
      await db.update(meta).set({
        state: state
      });

      return ctx.text('', 200);
    }
  )
  .get('/allocations/all-families', grantAccessTo('admin'), async ctx => {
    const parent1 = aliasedTable(students, 'parent1');
    const parent2 = aliasedTable(students, 'parent2');

    const allFamilies = await db
      .select()
      .from(marriages)
      .innerJoin(parent1, eq(parent1.shortcode, marriages.parent1))
      .innerJoin(parent2, eq(parent2.shortcode, marriages.parent2));

    const kids = await db
      .select()
      .from(families)
      .innerJoin(students, eq(families.kid, students.shortcode));

    const kidMap: Record<number, AllocatorFresher[]> = {};
    for (const kid of kids) {
      const student = kid.student;
      const fresher = {
        _id: student.shortcode,
        student: {
          firstName: student.name!,
          lastName: '',
          preferredName: student.name!,
          // the allocator only actually cares if the student identifies as female
          gender: (student.gender == 'female'
            ? 'Female'
            : 'other') as AllocatorGender,
          shortcode: student.shortcode,
          course: student.jmc ? 'JMC' : 'Computing',
          socialMedia: student.socials || []
        },
        interests: student.interests!,
        family: kid.family?.id
      };

      const curKids = kidMap[kid.family.id] || [];
      kidMap[kid.family.id] = [fresher, ...curKids];
    }

    const familiesToRet = [] as AllocatorFamily[];
    for (const family of allFamilies) {
      // @ts-ignore This is an error with Drizzle's table aliasing.
      const parent1: Student = family.parent1;
      // @ts-ignore
      const parent2: Student = family.parent2;

      const hasFemale =
        kidMap[family.marriage.id]?.find(
          fresher => fresher.student.gender == 'Female'
        ) != undefined ||
        parent1.gender == 'female' ||
        parent2.gender == 'female';
      const hasJmc =
        kidMap[family.marriage.id]?.find(
          fresher => fresher.student.course == 'JMC'
        ) != undefined ||
        parent1.jmc == true ||
        parent2.jmc == true;

      const allocatedParent1: AllocatorParent = {
        _id: parent1.shortcode,
        student: {
          shortcode: parent1.shortcode,
          firstName: parent1.name!,
          lastName: '',
          preferredName: parent1.name!,
          gender: parent1.gender == 'female' ? 'Female' : 'other',
          course: parent1.jmc ? 'JMC' : 'Computing',
          socialMedia: parent1.socials || []
        },
        interests: parent1.interests as Interests,
        family: family.marriage.id
      };

      const allocatedParent2: AllocatorParent = {
        _id: parent2.shortcode,
        student: {
          shortcode: parent2.shortcode,
          firstName: parent2.name!,
          lastName: '',
          preferredName: parent2.name!,
          gender: parent2.gender == 'female' ? 'Female' : 'other',
          course: parent2.jmc ? 'JMC' : 'Computing',
          socialMedia: parent2.socials || []
        },
        interests: parent2.interests as Interests,
        family: family.marriage.id
      };

      familiesToRet.push({
        _id: family.marriage.id,
        parents: {
          proposerId: allocatedParent1,
          proposeeId: allocatedParent2
        },
        kids: kidMap[family.marriage.id] || [],
        hasFemale: hasFemale,
        hasJmc: hasJmc
      });
    }

    return ctx.json(familiesToRet);
  })
  .get(
    '/allocations/all-unallocated-freshers',
    grantAccessTo('admin'),
    async ctx => {
      const unallocated = await db
        .select()
        .from(students)
        .leftJoin(families, eq(families.kid, students.shortcode))
        .where(
          and(
            and(eq(students.role, 'fresher'), isNull(families.kid)),
            eq(students.completedSurvey, true)
          )
        );

      const freshers = [] as AllocatorFresher[];
      for (const u of unallocated) {
        const student = u.student;
        freshers.push({
          _id: student.shortcode,
          student: {
            firstName: student.name!,
            lastName: '',
            preferredName: student.name!,
            // the allocator only actually cares if the student identifies as female
            gender: student.gender == 'female' ? 'Female' : 'other',
            shortcode: student.shortcode,
            course: student.jmc ? 'JMC' : 'Computing',
            socialMedia: student.socials || []
          },
          interests: student.interests!,
          family: u.family?.id
        });
      }

      return ctx.json(freshers, 200);
    }
  )
  .post(
    '/allocations',
    grantAccessTo('admin'),
    zValidator('json', allocationsSchema, (zRes, ctx) => {
      if (!zRes.success) {
        return ctx.text(
          'Allocator machine broke. Check both the zod schema or allocation post req.',
          400
        );
      }
    }),
    async ctx => {
      const allocations = ctx.req.valid('json');
      for (const allocation of allocations) {
        try {
          await db.insert(families).values({
            kid: allocation.fresher,
            id: allocation.family
          })
        } catch (e) {
          apiLogger.warn(ctx, 'Error in allocations; fresher or family is invalid:', e)
        }
      }

      return ctx.text('', 200)
    }
  );
