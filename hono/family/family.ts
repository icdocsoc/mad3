import { zValidator } from '@hono/zod-validator';
import { grantAccessTo } from '../auth/jwt';
import factory from '../factory';
import { z } from 'zod';
import {
  readAnswers,
  readDraft,
  studentColumns,
  SURVEY_VERSION
} from '../survey/survey';
import { asJsonb, db } from '../db';
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

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Holds both parents' rows until the transaction ends, so anything that pairs or unpairs
 * them happens one at a time. Rows are locked in key order, so two of these can't deadlock.
 */
const lockParents = (tx: Transaction, a: string, b: string) =>
  tx
    .select({ shortcode: students.shortcode })
    .from(students)
    .where(or(eq(students.shortcode, a), eq(students.shortcode, b)))
    .orderBy(students.shortcode)
    .for('update');

export const family = factory
  .createApp()
  .post(
    '/survey',
    requireState('open'),
    grantAccessTo('authenticated'),
    zValidator('json', surveySchema.strict(), async (zRes, ctx) => {
      if (!zRes.success) {
        return ctx.json(
          { error: 'Your answers did not arrive properly. Please try again.' },
          400
        );
      }
    }),
    async ctx => {
      const shortcode = ctx.get('shortcode')!;
      const read = readAnswers(
        ctx.req.valid('json').answers,
        shortcode,
        ctx.get('user_is')!
      );
      if (!read.ok) {
        return ctx.json({ error: read.error }, 400);
      }

      // Answers can be changed until sign-ups close; each save replaces the last.
      await db
        .update(students)
        .set({
          completedSurvey: true,
          answers: asJsonb(read.answers),
          surveyVersion: SURVEY_VERSION,
          draft: null,
          ...studentColumns(read.answers)
        })
        .where(eq(students.shortcode, shortcode));

      return ctx.json({ saved: true }, 200);
    }
  )
  .post(
    '/draft',
    requireState('open'),
    grantAccessTo('authenticated'),
    zValidator('json', surveySchema.strict(), async (zRes, ctx) => {
      if (!zRes.success) {
        return ctx.json(
          { error: 'Your answers did not arrive properly. Please try again.' },
          400
        );
      }
    }),
    async ctx => {
      const shortcode = ctx.get('shortcode')!;
      // Saved as typed, whether finished or not; `answers` only changes on submission.
      await db
        .update(students)
        .set({
          draft: asJsonb(readDraft(ctx.req.valid('json').answers, shortcode))
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
              'Wow, a blind proposal?! Talk about commitment! Please fill in the survey before proposing to your beloved.'
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
          {
            error:
              "Uh, you're already married, and I recall you both saying this is a closed marriage..."
          },
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
          return ctx.json(
            {
              error:
                "You've already proposed to them. It's a life-altering question, give them time!"
            },
            400
          );
        }
      }
      if (currProposals.length >= 3) {
        return ctx.json(
          {
            error:
              "You've already sent out 3 proposals. Calm down, player! Take one back to send another."
          },
          400
        );
      }

      // A double-tap sends the same proposal twice; the second changes nothing.
      await db
        .insert(proposals)
        .values({ proposer: proposer, proposee: proposee })
        .onConflictDoNothing();

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
      const proposalsInDb = await db.transaction(async tx => {
        // The same lock as accepting, so a take-back and an accept are decided one at a time.
        await lockParents(tx, proposer, proposee);
        return tx
          .delete(proposals)
          .where(
            and(
              eq(proposals.proposee, proposee),
              eq(proposals.proposer, proposer)
            )
          )
          .returning();
      });
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
              "Wow, a blind marriage?! Talk about commitment! Please fill in the survey before accepting your beloved's proposal."
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

      const married = await db.transaction(async tx => {
        // Lock both parents first. Two parents can accept each other's proposals at the same
        // moment; without the lock both would pass the checks and marry the pair twice.
        await lockParents(tx, proposee, proposer);

        const taken = await tx
          .select({ id: marriages.id })
          .from(marriages)
          .where(
            or(
              eq(marriages.parent1, proposee),
              eq(marriages.parent2, proposee),
              eq(marriages.parent1, proposer),
              eq(marriages.parent2, proposer)
            )
          );
        const stillProposed = await tx
          .select()
          .from(proposals)
          .where(
            and(
              eq(proposals.proposee, proposee),
              eq(proposals.proposer, proposer)
            )
          );
        if (taken.length || !stillProposed.length) return false;

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
        return true;
      });

      if (!married) {
        return ctx.json(
          {
            error:
              'One of you already has a partner, or the proposal was taken back.'
          },
          409
        );
      }

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
