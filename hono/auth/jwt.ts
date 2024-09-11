import { createMiddleware } from "hono/factory";
import { sign } from "hono/jwt";
import db from "../db";
import { auth } from "../db/auth";

const secret = process.env.JWT_SECRET!;

export async function newToken(
  email: string,
  access_token: string,
  refresh_token: string,
  expiresAt: Date
): Promise<string> {
  const gradYear = email.match(/[0-9]{2}(?=@)/);

  if (gradYear == null) {
    throw new Error("User email has no graduation year.");
  }

  const now = new Date();
  const academicYear =
    now.getFullYear() - Math.floor(now.getFullYear() / 100) * 100;
  const user_is = +gradYear[0] == academicYear ? "fresher" : "parent";

  const jwtExpiry = new Date();
  jwtExpiry.setMonth(jwtExpiry.getMonth() + 1);

  const payload = {
    email: email,
    user_is: user_is,
    exp: Math.floor(jwtExpiry.getTime() / 1000),
  };

  await db
    .insert(auth)
    .values({
      email: email,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: expiresAt,
    })
    .onConflictDoUpdate({
      target: auth.email,
      set: {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expiresAt,
      },
    });

  const token = await sign(payload, secret);

  return token;
}

export const authMiddleware = createMiddleware(async (ctx, next) => {
  const jwt_token = "";

  ctx.set("user_is", "parent/student");
  await next();
});
