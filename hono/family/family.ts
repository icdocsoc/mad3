import { zValidator } from '@hono/zod-validator';
import { grantAccessTo } from '../auth/jwt';
import factory from '../factory';
import { z } from 'zod';
import { allocatorInterests } from '../survey';
import { asJson, db } from '../db';
import { and, eq, or, getTableColumns } from 'drizzle-orm';
import {
  families,
  marriages,
  proposals,
  students,
  surveySchema
} from './schema';
import { requireState } from '../admin/admin';

const proposalSchema = z.object({
  shortcode: z.string()
});

export const family = factory
  .createApp()
  .post(
    '/survey',
    requireState('open'),
    grantAccessTo('authenticated'),
    zValidator('json', surveySchema.strict(), async (zRes, ctx) => {
      if (!zRes.success) {
        const issue = zRes.error.issues[0];
        return ctx.json(
          {
            error:
              issue?.message == 'Pick at least one interest.'
                ? issue.message
                : 'Some answers are missing. Go back through the survey and check each card.'
          },
          400
        );
      }
    }),
    async ctx => {
      const shortcode = ctx.get('shortcode')!;
      const answers = ctx.req.valid('json');

      // Answers can be changed until sign-ups close; each save replaces the last.
      await db
        .update(students)
        .set({
          completedSurvey: true,
          name: answers.name,
          preferredName: answers.preferredName,
          jmc: answers.jmc,
          gender: answers.gender,
          genderDescription:
            answers.gender == 'other' ? answers.genderDescription : null,
          commute: answers.commute,
          drinking: answers.drinking,
          lateNights: answers.lateNights,
          societies: answers.societies,
          meetingPeople: answers.meetingPeople,
          interests: asJson(
            allocatorInterests(
              answers.interests,
              answers.drinking,
              answers.lateNights
            )
          ),
          aboutMe: answers.aboutMe,
          instagram: answers.instagram,
          discord: answers.discord,
          phone: answers.phone
        })
        .where(eq(students.shortcode, shortcode));

      return ctx.json({ saved: true }, 200);
    }
  )
  .post(
    '/propose',
    requireState('open'),
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
        return ctx.text(
          'Invalid proposee. Have they signed in to MaDs yet?',
          400
        );
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
      for (const proposal of currProposals) {
        if (proposal.proposee == proposee) {
          return ctx.text('You have already proposed to this user.', 400);
        }
      }

      await db.insert(proposals).values({
        proposer: proposer,
        proposee: proposee
      });

      return ctx.text('', 200);
    }
  )
  .delete(
    '/proposal',
    requireState('open'),
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
    requireState('open'),
    grantAccessTo('parent'),
    zValidator('json', proposalSchema, async (zRes, ctx) => {
      if (!zRes.success) {
        return ctx.text('Invalid request.', 400);
      }
    }),
    async ctx => {
      const proposee = ctx.get('shortcode')!;
      const { shortcode: proposer } = ctx.req.valid('json');

      const studentInDb = await db
        .select()
        .from(students)
        .where(eq(students.shortcode, proposee));
      if (!studentInDb[0]!.completedSurvey) {
        return ctx.text(
          'My good fellow, how do you want to get married without having told us *anything* about yourself?',
          400
        );
      }

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
    requireState('open'),
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
  .get('/myFamily', grantAccessTo('authenticated'), async ctx => {
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
      .select(getTableColumns(students))
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
  });
