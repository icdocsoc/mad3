import { decode, sign, verify } from 'hono/jwt';
import type { AuthRoles, UserRole } from '../types';
import { getCookie } from 'hono/cookie';
import {
  JwtTokenExpired,
  JwtTokenSignatureMismatched
} from 'hono/utils/jwt/types';
import factory from '../factory';
import { apiLogger } from '../logger';

const secret = process.env.JWT_SECRET!;
const webmasters = process.env.WEBMASTERS!.split(',');

const START_OF_ACADEMIC_YEAR = 9; // September

/**
 * The two-digit year the current academic year started in, e.g. 25 for 2025-26. Worked out on
 * every call: the server runs for months, and a value fixed at start-up goes stale in September.
 */
export function academicYear(now = new Date()): number {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  return (month >= START_OF_ACADEMIC_YEAR ? year : year - 1) % 100;
}

// Secure outside local development, where the site is served over plain http.
const secure = process.env.BASE_URL?.startsWith('https://') ? '; Secure' : '';

export const generateCookieHeader = (token: string, maxAge: number) =>
  `Authorization=${token}; Max-Age=${maxAge}; HttpOnly; SameSite=Lax; Path=/${secure}`;

/** Guesses a role from the entry year in an email, for somebody not yet in the database. */
export function isFresherOrParent(email: string): 'fresher' | 'parent' {
  const entryYear = email.match(/[0-9]{2}(?=@)/);

  if (entryYear == null) {
    throw new Error('User email has no entry year.');
  }

  return +entryYear[0] == academicYear() ? 'fresher' : 'parent';
}

/**
 * Signs a session for a student. The role is passed in rather than read off the email, so the
 * session always agrees with the student's row: a fresher resitting first year keeps their
 * seeded role even though their email says an earlier year.
 */
export async function newToken(
  shortcode: string,
  user_is: UserRole
): Promise<string> {
  // Expire the token after 28 days, same with the cookie.
  const jwtExpiry = new Date();
  jwtExpiry.setDate(jwtExpiry.getDate() + 28);

  const payload = {
    shortcode: shortcode,
    user_is: user_is,
    // 28 days in unix time
    exp: Math.floor(jwtExpiry.getTime() / 1000)
  };

  return await sign(payload, secret);
}

export const decodeToken = () =>
  factory.createMiddleware(async (ctx, next) => {
    ctx.set('user_is', null);
    ctx.set('shortcode', null);

    const jwt_token = getCookie(ctx, 'Authorization');

    if (jwt_token == null) {
      return await next();
    }

    try {
      const payload = await verify(jwt_token, secret);

      const userIs = payload.user_is as UserRole;
      const shortcode = payload.shortcode as string;

      ctx.set('user_is', userIs);
      ctx.set('shortcode', shortcode);
    } catch (e) {
      if (e instanceof JwtTokenSignatureMismatched) {
        const data = decode(jwt_token);
        apiLogger.error(
          ctx,
          'Invalid JWT signature.',
          `Payload: ${JSON.stringify(data.payload)}`
        );
      } else if (e instanceof JwtTokenExpired) {
        // Delete their JWT token.
        ctx.header('Set-Cookie', generateCookieHeader('', 0));
      }
    }

    return await next();
  });

export const grantAccessTo = (...roles: [AuthRoles, ...AuthRoles[]]) =>
  factory.createMiddleware(async (ctx, next) => {
    const role = ctx.get('user_is');
    const shortcode = ctx.get('shortcode');

    if (roles.includes('all')) return await next();

    if (role == null || shortcode == null) {
      if (roles.includes('unauthenticated')) return await next();
      return ctx.json({ error: 'Please log in first.' }, 401);
    }

    if (roles.includes('admin') && webmasters.includes(shortcode))
      return await next();

    if (roles.includes(role) || roles.includes('authenticated')) {
      return await next();
    }
    return ctx.json({ error: 'This page is not for your account.' }, 403);
  });
