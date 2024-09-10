// import buildUrl from 'build-url-ts';
import { AuthorizationCodeCredential } from "@azure/identity";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { Client } from "@microsoft/microsoft-graph-client";
import MsApiClient from "./MsApiClient";

const tenantId = process.env.TENANT_ID!;
const clientId = process.env.CLIENT_ID!;
const clientSecret = process.env.CLIENT_SECRET!;
const redirectUri = `http://${process.env.BASE_URL}/api/oauth/callback`;
const scopes = ["User.Read", "profile", "Presence.Read"];

const msAuthEndpoint =
  "https://login.microsoftonline.com/2b897507-ee8c-4575-830b-4f8267c3d307/oauth2/v2.0";

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
    const client = new MsApiClient(scopes);
    return ctx.redirect(client.getRedirectUrl());
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

      const client = new MsApiClient(scopes)
      client.verifyAndConsumeCode(code!);
      
      const res = await client.msGet("/me", ['displayName', 'department']);

      return ctx.json({
        name: res.displayName,
        department: res.department
      })
    }
  );

export default oauth;
