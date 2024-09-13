import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { MicrosoftGraphClient, MsAuthClient } from "./MsApiClient";
import { grantAccessTo, newToken } from "./jwt";
import factory from "../factory";
import { apiLogger } from "../logger";

const msAuth = new MsAuthClient(
  ["profile"],
  {
    tenantId: process.env.TENANT_ID!,
    clientId: process.env.CLIENT_ID!,
    clientSecret: process.env.CLIENT_SECRET!,
  },
  `http://${process.env.BASE_URL}/api/auth/callback`
);

const callbackSchema = z.object({
  code: z.string(),
  state: z.string(),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

const auth = factory
  .createApp()
  .post("/signIn", grantAccessTo("unauthenticated"), async (ctx) => {
    return ctx.redirect(msAuth.getRedirectUrl());
  })
  .post("/signOut", grantAccessTo("authenticated"), async (ctx) => {
    ctx.header("Set-Cookie", `Authorization= ; Max-Age=0; HttpOnly`);
    return ctx.text("", 200);
  })
  .post(
    "/callback",
    grantAccessTo("unauthenticated"),
    zValidator("query", callbackSchema, async (zRes, ctx) => {
      if (!zRes.success || zRes.data.error_description) {
        apiLogger.warn(
          ctx,
          "Microsoft Entra Error:",
          zRes.data.error_description
        );
        return ctx.text("Invalid request.", 400);
      }
    }),
    async (ctx) => {
      // Code and state (once we implement that) are guaranteed to be defined.
      const { code, state } = ctx.req.valid("query");

      let client: MicrosoftGraphClient;
      try {
        client = await msAuth.verifyAndConsumeCode(code, state);
      } catch (e) {
        // Maybe return something differend based on the error (state or not) later.
        apiLogger.error(ctx, "Microsoft auth error:", e);
        return ctx.text("Internal server error.", 500);
      }

      const res = await client.get("/me", [
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

      // TODO: Replace this with role
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

export default auth;
