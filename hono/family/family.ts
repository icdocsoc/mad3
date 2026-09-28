import { zValidator } from '@hono/zod-validator';
import { grantAccessTo } from '../auth/jwt';
import factory from '../factory';
import { z } from 'zod';
import { allocatorInterests } from '../survey';
import { asJson, db } from '../db';
import { aliasedTable, and, eq, getTableColumns, or } from 'drizzle-orm';
import {
  families,
  marriages,
  proposals,
  students,
  surveySchema
} from './schema';
import { requireState } from '../admin/admin';

const proposalSchema = z.object({
  shortcode: z.string().trim().toLowerCase().min(1)
});

const invalidProposal = {
  error: 'Enter the shortcode of the parent you mean.'
};

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
        return ctx.json(invalidProposal, 400);
      }
    }),
    async ctx => {
      const proposer = ctx.get('shortcode')!;

      const proposerInDb = await db
        .select()
        .from(students)
        .where(eq(students.shortcode, proposer));
      if (!proposerInDb[0]!.completedSurvey) {
        return ctx.json(
          {
            error:
              'My good fellow, how do you want to propose without having told us *anything* about yourself? Fill in the survey first.'
          },
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
        return ctx.json(
          { error: 'You are already married. No cheating, nor polyamory.' },
          400
        );
      }

      const { shortcode: proposee } = ctx.req.valid('json');

      if (proposee == proposer) {
        return ctx.json(
          {
            error: "I'm glad you love yourself, but the kids need two parents."
          },
          400
        );
      }

      const [proposeeInDb] = await db
        .select({ role: students.role })
        .from(students)
        .where(eq(students.shortcode, proposee));

      if (!proposeeInDb) {
        return ctx.json(
          {
            error: `Nobody with the shortcode ${proposee} has signed in yet. Check the spelling, or ask them to log in first.`
          },
          400
        );
      }
      if (proposeeInDb.role != 'parent') {
        return ctx.json(
          {
            error: `${proposee} is signed up as a fresher, so they can't be a parent.`
          },
          400
        );
      }

      const theirMarriage = await db
        .select()
        .from(marriages)
        .where(
          or(eq(marriages.parent1, proposee), eq(marriages.parent2, proposee))
        );
      if (theirMarriage.length > 0) {
        return ctx.json({ error: `${proposee} already has a partner.` }, 400);
      }

      // 3 max proposals
      const currProposals = await db
        .select()
        .from(proposals)
        .where(eq(proposals.proposer, proposer));
      // No dupe proposals
      for (const proposal of currProposals) {
        if (proposal.proposee == proposee) {
          return ctx.json({ error: 'You have already proposed to them.' }, 400);
        }
      }
      if (currProposals.length >= 3) {
        return ctx.json(
          {
            error:
              'You already have 3 proposals out. Take one back to send another.'
          },
          400
        );
      }

      await db.insert(proposals).values({
        proposer: proposer,
        proposee: proposee
      });

      return ctx.json({ proposed: proposee }, 200);
    }
  )
  .delete(
    '/proposal',
    requireState('open'),
    grantAccessTo('parent'),
    zValidator('json', proposalSchema, async (zRes, ctx) => {
      if (!zRes.success) {
        return ctx.json(invalidProposal, 400);
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
        return ctx.json(
          {
            error:
              "This proposal does not exist. Why are you taking back a proposal you haven't made?"
          },
          400
        );
      }

      return ctx.json({ revoked: proposee }, 200);
    }
  )
  .post(
    '/acceptProposal',
    requireState('open'),
    grantAccessTo('parent'),
    zValidator('json', proposalSchema, async (zRes, ctx) => {
      if (!zRes.success) {
        return ctx.json(invalidProposal, 400);
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
        return ctx.json(
          {
            error:
              'My good fellow, how do you want to get married without having told us *anything* about yourself? Fill in the survey first.'
          },
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
        return ctx.json(
          {
            error:
              'This proposal does not exist anymore: they may have taken it back, or found another partner.'
          },
          400
        );
      }

      await db.transaction(async tx => {
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

      return ctx.json({ partner: proposer }, 200);
    }
  )
  .get(
    '/proposals',
    requireState('open'),
    grantAccessTo('parent'),
    async ctx => {
      const shortcode = ctx.get('shortcode')!;

      const proposer = aliasedTable(students, 'proposer');
      const proposee = aliasedTable(students, 'proposee');
      const proposalsInDb = await db
        .select({
          proposer: proposals.proposer,
          proposee: proposals.proposee,
          proposerName: proposer.name,
          proposeeName: proposee.name
        })
        .from(proposals)
        .innerJoin(proposer, eq(proposer.shortcode, proposals.proposer))
        .innerJoin(proposee, eq(proposee.shortcode, proposals.proposee))
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
      return ctx.json({ error: 'You do not have a family yet.' }, 404);
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
