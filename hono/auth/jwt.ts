import { createMiddleware } from "hono/factory";
import { sign, verify } from "hono/jwt";
import type { AuthRoles } from "../types";
import { getCookie } from "hono/cookie";
import { JwtTokenExpired, JwtTokenSignatureMismatched } from "hono/utils/jwt/types";

const secret = process.env.JWT_SECRET!;

export async function newToken(email: string): Promise<string> {
  const gradYear = email.match(/[0-9]{2}(?=@)/);

  if (gradYear == null) {
    throw new Error("User email has no graduation year.");
  }

  const now = new Date();
  const academicYear =
    now.getFullYear() - Math.floor(now.getFullYear() / 100) * 100;
  const user_is = +gradYear[0] == academicYear ? "fresher" : "parent";

  const jwtExpiry = new Date();
  jwtExpiry.setMonth(jwtExpiry.getDay() + 14);

  const payload = {
    email: email,
    user_is: user_is,
    exp: Math.floor(jwtExpiry.getTime() / 1000),
  };

  const token = await sign(payload, secret);

  return token;
}

export const decodeToken = createMiddleware(async (ctx, next) => {
  ctx.set("user_is", null);
  ctx.set("email", null);

  const jwt_token = getCookie(ctx, 'Authorization');

  if (jwt_token == null) {
    return await next();
  }

  try {
    const payload = await verify(jwt_token, secret);
    ctx.set("user_is", payload.user_is);
    ctx.set("email", payload.email);
  } catch (e) {
    if (e instanceof JwtTokenSignatureMismatched) {
      // TODO: Log this malicious actor
      console.log("signature mismatch")
    }
    else if (e instanceof JwtTokenExpired) {
      // Delete their JWT token.
      console.log("deleted")
      ctx.header("Set-Cookie", `Authorization= ; Max-Age=0; HttpOnly`);
    }
  }

  await next();
});

export const grantAccessTo = (...roles: [AuthRoles, ...AuthRoles[]]) =>
  createMiddleware(async (ctx, next) => {
    const no_auth = "Missing authorization.";
    const role = ctx.get('user_is');

    if (roles.includes("all")) await next();

    if (role == null) {
      if ("unauthenticated" in roles) await next();
      else return ctx.redirect("/api/oauth/signIn");
    }

    if (roles.includes(role) || roles.includes("authenticated")) {
      await next();
    } else {
      return ctx.text(no_auth, 403);
    }
  });
