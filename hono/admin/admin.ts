import { zValidator } from '@hono/zod-validator';
import { grantAccessTo } from '../auth/jwt';
import db from '../db';
import factory from '../factory';
import { stateOptions, type State } from '../types';
import { meta } from './schema';
import { z } from 'zod';

export const requireState = (state: State) =>
  factory.createMiddleware(async (ctx, next) => {
    const settings = await db.select().from(meta);
    const currState = settings[0]!.state;

    if (currState != state) {
      return ctx.text(
        'It is not yet time to use this route, but I appreciate your enthusiasm.',
        403
      );
    }

    return await next();
  });

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
          return ctx.text('You know better, Jay and Nishant.', 400)
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
  );
