import { zValidator } from '@hono/zod-validator';
import { grantAccessTo } from '../auth/jwt';
import factory from '../factory';
import { z } from 'zod';
import { type Interests } from '../types';
import { db } from '../db';
import { and, eq, or } from 'drizzle-orm';
import {
  families,
  marriages,
  proposals,
  students,
  surveySchema
} from './schema';
import { requireState } from '../admin/admin';
import { meta } from '../admin/schema';

const proposalSchema = z.object({
  shortcode: z.string()
});

export const family = factory
  .createApp()
  .post(
    '/survey',
    requireState('parents_open', 'freshers_open'),
    grantAccessTo('authenticated'),
    zValidator('json', surveySchema.strict(), async (zRes, ctx) => {
      if (!zRes.success) {
        return ctx.text('Invalid body.', 400);
      }
    }),
    async ctx => {
      const shortcode = ctx.get('shortcode')!;

      const studentInDb = await db
        .select({
          role: students.role,
          completedSurvey: students.completedSurvey
        })
        .from(students)
        .where(eq(students.shortcode, shortcode));
      if (studentInDb[0]!.completedSurvey == true) {
        return ctx.text('You have already completed the survey.', 400);
      }

      // Ensure that parents can only complete the route during parents_open,
      // and students can only complete the route during students_open.
      const metaInDb = await db.select().from(meta);
      if (!metaInDb[0]!.state.includes(studentInDb[0]!.role)) {
        return ctx.text(
          `It is not yet your time o ${studentInDb[0]!.role}.`,
          400
        );
      }

      const { name, interests, aboutMe, socials, gender, jmc } =
        ctx.req.valid('json');

      await db
        .update(students)
        .set({
          completedSurvey: true,
          name: name,
          interests: interests as Interests,
          aboutMe: aboutMe,
          socials: socials,
          gender: gender,
          jmc: jmc
        })
        .where(eq(students.shortcode, shortcode));

      return ctx.text('', 200);
    }
  )
  .post(
    '/propose',
    requireState('parents_open'),
    grantAccessTo('parent'),
    zValidator('json', proposalSchema, async (zRes, ctx) => {
      if (!zRes.success) {
        return ctx.text('Invalid request.', 400);
      }
    }),
    async ctx => {
      const proposer = ctx.get('shortcode')!;

      const proposerInDb = await db
        .select()
        .from(students)
        .where(eq(students.shortcode, proposer));
      if (!proposerInDb[0]!.completedSurvey) {
        return ctx.text(
          'My good fellow, how do you want to propose without having told us *anything* about yourself?',
          400
        );
      }

      const marriageInDb = await db
        .select()
        .from(marriages)
        .where(
          or(eq(marriages.parent1, proposer), eq(marriages.parent2, proposer))
        );
      if (marriageInDb.length > 0) {
        return ctx.text(
          'You are already married. No cheating, nor polamory.',
          400
        );
      }

      const { shortcode: proposee } = ctx.req.valid('json');

      if (proposee == proposer) {
        return ctx.text(
          "I'm glad you love yourself, but the kids need two parents.",
          400
        );
      }

      const proposeeInDb = await db
        .select({ shortcode: students.shortcode })
        .from(students)
        .where(eq(students.shortcode, proposee));

      if (proposeeInDb.length == 0) {
        return ctx.text('Invalid proposee.', 400);
      }

      // 3 max proposals
      const currProposals = await db
        .select()
        .from(proposals)
        .where(eq(proposals.proposer, proposer));
      if (currProposals.length >= 3) {
        return ctx.text(
          'You have already reached max number of proposals. Revoke a proposal to send another one.',
          400
        );
      }

      // No dupe proposals
      currProposals.forEach(({ proposer: _proposer, proposee: _proposee }) => {
        if (_proposee == proposee)
          return ctx.text('You have already proposed to this user.', 400);
      });

      await db.insert(proposals).values({
        proposer: proposer,
        proposee: proposee
      });

      return ctx.text('', 200);
    }
  )
  .delete(
    '/proposal',
    requireState('parents_open'),
    grantAccessTo('parent'),
    zValidator('json', proposalSchema, async (zRes, ctx) => {
      if (!zRes.success) {
        return ctx.text('Invalid request.', 400);
      }
    }),
    async ctx => {
      const proposer = ctx.get('shortcode')!;
      const { shortcode: proposee } = ctx.req.valid('json');

      // You can only revoke a proposal, not deny a proposal to save the emotions of the proposer
      // as per a discussion within the DoCSoc 24/25 commitee.
      const proposalsInDb = await db
        .delete(proposals)
        .where(
          and(
            eq(proposals.proposee, proposee),
            eq(proposals.proposer, proposer)
          )
        )
        .returning();
      if (proposalsInDb.length != 1) {
        return ctx.text(
          "This proposal does not exist. Why are you taking back a proposal you haven't made?",
          400
        );
      }

      return ctx.text('', 200);
    }
  )
  .post(
    '/acceptProposal',
    requireState('parents_open'),
    grantAccessTo('parent'),
    zValidator('json', proposalSchema, async (zRes, ctx) => {
      if (!zRes.success) {
        return ctx.text('Invalid request.', 400);
      }
    }),
    async ctx => {
      const proposee = ctx.get('shortcode')!;
      const { shortcode: proposer } = ctx.req.valid('json');

      const proposalsInDb = await db
        .select()
        .from(proposals)
        .where(
          and(
            eq(proposals.proposee, proposee),
            eq(proposals.proposer, proposer)
          )
        );

      if (proposalsInDb.length != 1) {
        return ctx.text(
          "This proposal does not exist. You can't force a marriage where love doesn't exist.",
          400
        );
      }

      db.transaction(async tx => {
        // Delete any pending proposals including the proposee and proposer.
        // This is a lifelong commitment.
        await tx
          .delete(proposals)
          .where(
            or(
              or(
                eq(proposals.proposee, proposee),
                eq(proposals.proposer, proposer)
              ),
              or(
                eq(proposals.proposer, proposee),
                eq(proposals.proposee, proposer)
              )
            )
          );
        await tx.insert(marriages).values({
          parent1: proposee,
          parent2: proposer
        });
      });

      return ctx.text('', 200);
    }
  )
  .get(
    '/proposals',
    requireState('parents_open'),
    grantAccessTo('parent'),
    async ctx => {
      const shortcode = ctx.get('shortcode')!;

      const proposalsInDb = await db
        .select()
        .from(proposals)
        .where(
          or(
            eq(proposals.proposee, shortcode),
            eq(proposals.proposer, shortcode)
          )
        );

      return ctx.json(proposalsInDb, 200);
    }
  )
  .get('/me', grantAccessTo('authenticated'), async ctx => {
    const shortcode = ctx.get('shortcode')!;

    const userInDb = await db
      .select()
      .from(students)
      .where(eq(students.shortcode, shortcode));

    return ctx.json(userInDb[0], 200);
  })
  .get(
    '/myFamily',
    grantAccessTo('authenticated'),
    async ctx => {
      const reqShortcode = ctx.get('shortcode')!;
      const role = ctx.get('user_is');

      let familyInDb: { id: number }[];
      if (role == 'parent') {
        familyInDb = await db
          .select({
            id: marriages.id
          })
          .from(marriages)
          .where(
            or(
              eq(marriages.parent1, reqShortcode),
              eq(marriages.parent2, reqShortcode)
            )
          );
      } else {
        familyInDb = await db
          .select({
            id: families.id
          })
          .from(families)
          .where(eq(families.kid, reqShortcode));
      }

      if (familyInDb.length == 0) {
        return ctx.text('You do not have a family.', 400);
      }

      const familyId = familyInDb[0]!.id;

      const kids = await db
        .select({
          shortcode: students.shortcode,
          jmc: students.jmc,
          role: students.role,
          completedSurvey: students.completedSurvey,
          name: students.name,
          gender: students.gender,
          interests: students.interests,
          socials: students.socials,
          aboutMe: students.aboutMe
        })
        .from(families)
        .where(eq(families.id, familyId))
        .innerJoin(students, eq(families.kid, students.shortcode));

      const marriageInDb = await db
        .select()
        .from(marriages)
        .where(eq(marriages.id, familyId));

      const [parent1, parent2] = await Promise.all([
        db
          .select()
          .from(students)
          .where(eq(students.shortcode, marriageInDb[0]!.parent1)),
        db
          .select()
          .from(students)
          .where(eq(students.shortcode, marriageInDb[0]!.parent2))
      ]);

      return ctx.json(
        {
          id: familyId,
          parents: [parent1[0], parent2[0]],
          kids: kids
        },
        200
      );
    }
  );
