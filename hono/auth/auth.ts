import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { MicrosoftGraphClient, MsAuthClient } from './MsApiClient';
import {
  generateCookieHeader,
  grantAccessTo,
  isFresherOrParent,
  newToken
} from './jwt';
import factory from '../factory';
import { apiLogger } from '../logger';
import { db } from '../db';
import { students } from '../family/schema';
import { eq } from 'drizzle-orm';

const msAuth = new MsAuthClient(
  ['User.Read'],
  {
    tenantId: process.env.TENANT_ID!,
    clientId: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!
  },
  `${process.env.BASE_URL}/finish-oauth`
);

const callbackSchema = z.object({
  code: z.string(),
  state: z.string(),
  error: z.string().optional(),
  error_description: z.string().optional()
});

const auth = factory
  .createApp()
  .get('/signIn', grantAccessTo('unauthenticated'), async ctx => {
    // Redirect the user to the Microsoft oAuth sign in.
    return ctx.redirect(msAuth.getRedirectUrl());
  })
  .get(
    '/signOut',
    zValidator(
      'query',
      z.object({
        redirect: z.string().optional()
      })
    ),
    grantAccessTo('authenticated'),
    async ctx => {
      // Delete their JWT cookie.
      ctx.header('Set-Cookie', generateCookieHeader('', 0));
      const query = ctx.req.valid('query');

      const path = query.redirect || '';
      const redirectUrl = process.env.BASE_URL! + path + '?loggedOut=true';

      return ctx.redirect(redirectUrl);
    }
  )
  .post(
    '/callback',
    grantAccessTo('unauthenticated'),
    zValidator('json', callbackSchema, async (zRes, ctx) => {
      if (!zRes.success || zRes.data.error_description) {
        apiLogger.warn(
          ctx,
          'Microsoft Entra Error:',
          zRes.data.error_description
        );
        return ctx.text('Invalid request.', 400);
      }
    }),
    async ctx => {
      const { code, state } = ctx.req.valid('json');

      let client: MicrosoftGraphClient;
      try {
        client = await msAuth.verifyAndConsumeCode(code, state);
      } catch (e) {
        apiLogger.error(ctx, 'Microsoft auth error:', e);
        return ctx.text('Internal server error.', 500);
      }

      // Get their department, short, and long email.
      const res = await client.get('/me', [
        'department',
        'userPrincipalName',
        'mail'
      ]);

      if (res.department != 'Computing') {
        return ctx.json(
          {
            error: 'You are not a Computing student :('
          },
          403
        );
      }

      const shortcode = res.userPrincipalName.match(/.*(?=@)/g);
      if (shortcode == null) {
        return ctx.json(
          {
            error: 'User has no shortcode.'
          },
          400
        );
      }

      let token: string;
      try {
        token = await newToken(res.mail, shortcode[0]);
      } catch (e) {
        // The only error we can get is that it fails to get an entry year.
        return ctx.json(
          {
            error: 'User has no entry year. Are you a professor?'
          },
          400
        );
      }
      const user_is = isFresherOrParent(res.mail);

      // Expire the JWT after 4 weeks.
      // Should be long enough for MaDs to only sign in once.
      const maxAge = 28 * 24 * 60 * 60;
      ctx.header('Set-Cookie', generateCookieHeader(token, maxAge));

      let completedSurvey = false;
      const studentInDb = await db
        .select()
        .from(students)
        .where(eq(students.shortcode, shortcode[0]));
      if (studentInDb.length == 1 && studentInDb[0]?.completedSurvey)
        completedSurvey = true;
      else if (studentInDb.length == 0) {
        await db.insert(students).values({
          shortcode: shortcode[0],
          role: user_is,
          completedSurvey: false
        });
      }

      return ctx.json(
        {
          user_is: user_is,
          done_survey: completedSurvey
        },
        200
      );
    }
  )
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
