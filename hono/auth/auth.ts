import { zValidator } from '@hono/zod-validator';
import { createHash, randomInt, timingSafeEqual } from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '../db';
import factory from '../factory';
import { students } from '../family/schema';
import { apiLogger } from '../logger';
import { sendEmail } from '../mailer';
import type { UserRole } from '../types';
import {
  academicYear,
  generateCookieHeader,
  grantAccessTo,
  isFresherOrParent,
  newToken
} from './jwt';
import { loginCodes, loginSchema, verifySchema } from './schema';

/**
 * Sign-in is a six-digit code emailed to a shortcode address and typed back on the site.
 * Links were used before, but anything that opened the link first (a mail scanner, a phone's
 * mail app with its own browser) used it up or signed in the wrong browser. A code only works
 * where it is typed.
 */

const CODE_MINUTES = 10;
const RESEND_SECONDS = 60;
const MAX_ATTEMPTS = 5;

// Expire the session after 4 weeks: long enough for MaDs to only sign in once.
const SESSION_SECONDS = 28 * 24 * 60 * 60;

const hash = (email: string, code: string) =>
  createHash('sha256').update(`${email}:${code}`).digest('hex');

const bytes = (text: string) => new TextEncoder().encode(text);
const sameHash = (a: string, b: string) =>
  a.length == b.length && timingSafeEqual(bytes(a), bytes(b));

const abcApi = {
  baseUrl: process.env.ABC_API_BASE,
  auth: `Basic ${btoa(`${process.env.ABC_API_USER}:${process.env.ABC_API_PASS}`)}`,
  // Eligible parents are on Scientia as of last academic year.
  identity: (shortcode: string) => {
    const year = academicYear();
    return fetch(
      `${abcApi.baseUrl}/${year - 1}${year}/identity?login=${shortcode}`,
      { headers: { Authorization: abcApi.auth } }
    );
  }
};

/** What went wrong with an address, in words someone can act on. */
function addressProblem(email: unknown) {
  if (typeof email == 'string' && /@imperial\.ac\.uk\s*$/i.test(email)) {
    return 'Use your shortcode (like ab1224), not your long first.last email.';
  }
  return 'Enter your Imperial shortcode, like ab1224.';
}

type Eligibility =
  | { ok: true; role: UserRole; completedSurvey: boolean; isNew: boolean }
  | { ok: false; status: 400 | 403 | 503; error: string };

/**
 * Whether someone may use MaDs. Freshers are seeded into the database, as is anyone the
 * committee lets in by hand; everyone else must be a DoC student on ABC as of last year.
 */
async function eligibility(
  shortcode: string,
  email: string
): Promise<Eligibility> {
  const [student] = await db
    .select()
    .from(students)
    .where(eq(students.shortcode, shortcode));
  if (student) {
    return {
      ok: true,
      role: student.role,
      completedSurvey: student.completedSurvey,
      isNew: false
    };
  }

  let identity: Response;
  try {
    identity = await abcApi.identity(shortcode);
  } catch {
    identity = new Response(null, { status: 503 });
  }
  if (identity.status == 404) {
    return {
      ok: false,
      status: 403,
      error:
        "We couldn't find you as a DoC Computing or JMC student. If you are one, email docsoc@ic.ac.uk and we'll let you in."
    };
  }
  if (!identity.ok) {
    return {
      ok: false,
      status: 503,
      error:
        "We couldn't check your student record just now. Please try again in a minute."
    };
  }

  try {
    return {
      ok: true,
      role: isFresherOrParent(email),
      completedSurvey: false,
      isNew: true
    };
  } catch {
    return {
      ok: false,
      status: 400,
      error:
        'Your shortcode has no entry year, so we cannot tell if you are a fresher or a parent.'
    };
  }
}

const auth = factory
  .createApp()
  .post(
    '/login',
    grantAccessTo('all'),
    zValidator('json', loginSchema, async (zRes, ctx) => {
      if (!zRes.success) {
        const body = await ctx.req.json().catch(() => ({}));
        return ctx.json({ error: addressProblem(body?.email) }, 400);
      }
    }),
    async ctx => {
      const { email } = ctx.req.valid('json');

      const [previous] = await db
        .select({ sentAt: loginCodes.sentAt })
        .from(loginCodes)
        .where(eq(loginCodes.email, email));
      const wait = previous
        ? RESEND_SECONDS -
          Math.floor((Date.now() - previous.sentAt.getTime()) / 1000)
        : 0;
      if (wait > 0) {
        return ctx.json(
          {
            error: `We just sent you a code. You can ask for another in ${wait} seconds.`
          },
          429
        );
      }

      const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
      try {
        // Safe to put in the HTML: the address was checked to be a shortcode email.
        const shortcode = email.split('@')[0];
        await sendEmail(
          ctx,
          email,
          // No code in the subject: "your code is 123456" subjects look like phishing to filters.
          'Your Mums and Dads one-time passcode',
          `Hello ${shortcode}, here is your one-time passcode to log in to the Mums and Dads Scheme for DoCSoc!\n\n${code}`,
          `<p>Hello ${shortcode}, here is your one-time passcode to log in to the Mums and Dads Scheme for DoCSoc!</p><p style="font-size:28px;font-weight:bold;letter-spacing:4px">${code}</p>`
        );
      } catch (e) {
        apiLogger.error(ctx, 'Could not send a sign-in code:', e);
        return ctx.json(
          {
            error:
              "We couldn't send your code just now. Please try again in a minute."
          },
          502
        );
      }

      // Only once the email has gone: a code nobody received must not block a retry.
      const now = new Date();
      const row = {
        codeHash: hash(email, code),
        expiresAt: new Date(now.getTime() + CODE_MINUTES * 60 * 1000),
        sentAt: now,
        attempts: 0
      };
      await db
        .insert(loginCodes)
        .values({ email, ...row })
        .onConflictDoUpdate({ target: loginCodes.email, set: row });

      return ctx.json({ sent: true }, 200);
    }
  )
  .post(
    '/verify',
    grantAccessTo('all'),
    zValidator('json', verifySchema, async (zRes, ctx) => {
      if (!zRes.success) {
        return ctx.json(
          { error: 'Enter the six-digit code from your email.' },
          400
        );
      }
    }),
    async ctx => {
      const { email, code } = ctx.req.valid('json');

      const [pending] = await db
        .select()
        .from(loginCodes)
        .where(eq(loginCodes.email, email));
      if (!pending || pending.expiresAt.getTime() < Date.now()) {
        return ctx.json(
          { error: 'That code has expired. Ask for a new one.' },
          400
        );
      }

      if (!sameHash(pending.codeHash, hash(email, code))) {
        const attempts = pending.attempts + 1;
        if (attempts >= MAX_ATTEMPTS) {
          await db.delete(loginCodes).where(eq(loginCodes.email, email));
          return ctx.json(
            { error: 'Too many wrong codes. Ask for a new one.' },
            429
          );
        }
        await db
          .update(loginCodes)
          .set({ attempts })
          .where(eq(loginCodes.email, email));
        const left = MAX_ATTEMPTS - attempts;
        return ctx.json(
          {
            error: `That code isn't right. You have ${left} ${left == 1 ? 'try' : 'tries'} left.`
          },
          400
        );
      }

      await db.delete(loginCodes).where(eq(loginCodes.email, email));

      const shortcode = email.split('@')[0]!;
      const eligible = await eligibility(shortcode, email);
      if (!eligible.ok) {
        return ctx.json({ error: eligible.error }, eligible.status);
      }

      if (eligible.isNew) {
        await db
          .insert(students)
          .values({ shortcode, role: eligible.role, completedSurvey: false })
          .onConflictDoNothing();
      }

      const token = await newToken(shortcode, eligible.role);
      ctx.header('Set-Cookie', generateCookieHeader(token, SESSION_SECONDS));

      return ctx.json(
        { user_is: eligible.role, done_survey: eligible.completedSurvey },
        200
      );
    }
  )
  // A POST, so a link preview or a prefetch can't sign anyone out.
  .post('/signOut', grantAccessTo('all'), async ctx => {
    // Delete their JWT cookie.
    ctx.header('Set-Cookie', generateCookieHeader('', 0));
    return ctx.redirect(`${process.env.BASE_URL ?? ''}/?loggedOut=true`);
  })
  .get('/details', grantAccessTo('authenticated'), async ctx => {
    // Mostly a test route but doesn't hurt to keep.
    const shortcode = ctx.get('shortcode')!;
    const user_is = ctx.get('user_is')!;

    const studentInDb = await db
      .select()
      .from(students)
      .where(eq(students.shortcode, shortcode));

    return ctx.json(
      {
        shortcode: shortcode,
        user_is: user_is,
        doneSurvey: studentInDb[0]?.completedSurvey || false
      },
      200
    );
  });

export default auth;
