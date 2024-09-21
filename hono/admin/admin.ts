import { zValidator } from '@hono/zod-validator';
import { grantAccessTo } from '../auth/jwt';
import { db } from '../db';
import factory from '../factory';
import { stateOptions, type State } from '../types';
import { meta } from './schema';
import { z } from 'zod';

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
  .get('/all-families', grantAccessTo('admin'), async ctx => {
    /* 
    Given types
    
    Student: {
      firstName: string,
      lastName: string,
      preferredName: string,
      gender: string (Female | Male | other | na) but only female actually matters,
      shortcode: string,
      course: string,
      socialMedia: string[]
    }

    Fresher: {
      _id: idfk python isn't typed,
      student: Student
      interests: Interests
      family: i dont know. python isn't typed. kill me.
    }
    
    Parent: {
      _id: idk,
      student: Student,
      interests: Interests,
      family: idk. python isn't typed.
    }

    Need to return JSON of 
    id: 
    {
      parents: [
        proposerId: Parent
        proposeeId: Parent
      ]
      _id: idk
      kids: Fresher[]
      hasFemale: bool,
      hasJmc: bool
    }
    */
  })
  .get('/all-unallocated-freshers', grantAccessTo('admin'), async ctx => {
    /*
    Given types 
      Student: {
      firstName: string,
      lastName: string,
      preferredName: string,
      gender: string (Female | Male | other | na) but only female actually matters,
      shortcode: string,
      course: string,
      socialMedia: string[]
    }

    Fresher: {
      _id: idfk python isn't typed,
      student: Student
      interests: Interests
      family: i dont know. python isn't typed. kill me.
    }

    Need to return JSON of 
    id: Fresher
    */
  });
