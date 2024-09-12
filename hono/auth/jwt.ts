import { decode, sign, verify } from "hono/jwt";
import type { AuthRoles, UserRole } from "../types";
import { getCookie } from "hono/cookie";
import {
  JwtTokenExpired,
  JwtTokenSignatureMismatched,
} from "hono/utils/jwt/types";
import factory from "../factory";
import { apiLogger } from "../logger";

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

export const decodeToken = () =>
  factory.createMiddleware(async (ctx, next) => {
    ctx.set("user_is", null);
    ctx.set("email", null);

    const jwt_token = getCookie(ctx, "Authorization");

    if (jwt_token == null) {
      return await next();
    }

    try {
      const payload = await verify(jwt_token, secret);

      const userIs = payload.user_is as UserRole;
      const email = payload.email as string;

      ctx.set("user_is", userIs);
      ctx.set("email", email);
    } catch (e) {
      if (e instanceof JwtTokenSignatureMismatched) {
        const data = decode(jwt_token);
        apiLogger.error(
          ctx,
          "Invalid JWT signature.",
          `Payload: ${JSON.stringify(data.payload)}`
        );
      } else if (e instanceof JwtTokenExpired) {
        // Delete their JWT token.
        ctx.header("Set-Cookie", `Authorization= ; Max-Age=0; HttpOnly`);
      }
    }

    return await next();
  });

export const grantAccessTo = (...roles: [AuthRoles, ...AuthRoles[]]) =>
  factory.createMiddleware(async (ctx, next) => {
    const no_auth = "You do not have access to this route.";
    const role = ctx.get("user_is");

    if (roles.includes("all")) return await next();

    if (role == null) {
      if (roles.includes("unauthenticated")) return await next();
      else return ctx.redirect("/api/auth/signIn");
    }

    if (roles.includes(role) || roles.includes("authenticated")) {
      return await next();
    } else {
      return ctx.text(no_auth, 403);
    }
  });
