// import buildUrl from 'build-url-ts';
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { MsAuthClient, TypedGraphClient } from "./MsApiClient";
import { newToken } from "./jwt";

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

const oauth = new Hono()
  .get("/signIn", async (ctx) => {
    return ctx.redirect(msAuth.getRedirectUrl());
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
      const res = await client.msGet("/me", ["displayName", "department", "userPrincipalName"]);


      if (res.department != "Computing") {
        return ctx.text("You are not a Computing student :(", 403);
      }

      const token = await newToken(res.displayName, res.userPrincipalName, client.access_token, client.refresh_token, client.expiresAt)

      ctx.header("Authorization", token);

      return ctx.json({
        name: res.displayName,
        department: res.department,
        email: res.userPrincipalName
      }, 200);
    }
  );

export default oauth;
