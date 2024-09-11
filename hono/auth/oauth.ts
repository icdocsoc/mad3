// import buildUrl from 'build-url-ts';
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { MsAuthClient } from "./MsApiClient";
import { grantAccessTo, newToken } from "./jwt";
import factory from "../factory";

const msAuth = new MsAuthClient(
  ["User.Read", "profile", "Presence.Read"],
  {
    tenantId: process.env.TENANT_ID!,
    clientId: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
  },
  `http://${process.env.BASE_URL}/api/oauth/callback`
);

const callbackSchema = z
  .object({
    error: z.string(),
    error_description: z.string(),
    code: z.string(),
    state: z.string(),
  })
  .partial();

// Note to self:
// https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow

const oauth = factory
  .createApp()
  .get("/signIn", async (ctx) => {
    return ctx.redirect(msAuth.getRedirectUrl());
  })
  .get("/signOut", grantAccessTo("all"), async (ctx) => {
    // We don't bother checking if they're signed in as this is very cheap & will instruct the browser to clear the cookie regardless.
    ctx.header("Set-Cookie", `Authorization= ; Max-Age=0; HttpOnly`);
    return ctx.text("", 200);
  })
  .get(
    "/callback",
    zValidator("query", callbackSchema, async (zRes, ctx) => {
      if (!zRes.success) {
        return ctx.text("Invalid request.", 400);
      } else if (zRes.data.error) {
        return ctx.text(
          `Error while authenticating: ${zRes.data.error_description}`,
          400
        );
      }
    }),
    async (ctx) => {
      // Code and state (once we implement that) are guaranteed to be defined.
      const { code, state } = ctx.req.valid("query");

      const client = await msAuth.verifyAndConsumeCode(code!);
      const res = await client.msGet("/me", [
        "displayName",
        "department",
        "userPrincipalName",
      ]);

      if (res.department != "Computing") {
        return ctx.text("You are not a Computing student :(", 403);
      }

      const token = await newToken(res.userPrincipalName);

      // 14 days
      const maxAge = 14 * 24 * 60 * 60;
      ctx.header(
        "Set-Cookie",
        `Authorization=${token}; Max-Age=${maxAge}; HttpOnly`
      );

      // TODO: Replace this with a redirect to the landing page or whatever
      return ctx.json(
        {
          name: res.displayName,
          department: res.department,
          email: res.userPrincipalName,
        },
        200
      );
    }
  )
  .get("/token", async (ctx) => {
    // Getting a short lived JWT token for my testing
    const token = await newToken("aa7123@ic.ac.uk");

    // 2 min
    const maxAge = 14 * 24 * 60 * 60;
    ctx.header(
      "Set-Cookie",
      `Authorization=${token}; Max-Age=${maxAge}; HttpOnly`
    );

    return ctx.text("ok", 200);
  })
  .get("/details", grantAccessTo("authenticated"), async (ctx) => {
    // Just so I can test signed ins for now.
    const email = ctx.get("email");
    const user_is = ctx.get("user_is");

    return ctx.json(
      {
        email: email,
        user_is: user_is,
      },
      200
    );
  });

export default oauth;
