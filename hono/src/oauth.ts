// import buildUrl from 'build-url-ts';
import { Hono } from "hono";

const tenantId = process.env.TENANT_ID!;
const clientId = process.env.CLIENT_ID!;
const clientSecret = process.env.CLIENT_SECRET!;
const authCode = process.env.AUTH_CODE;
const redirectUri = `${process.env.BASE_URL}/oauth/callback`;

const msAuthEndpoint = "https://login.microsoftonline.com/2b897507-ee8c-4575-830b-4f8267c3d307/oauth2/v2.0"

const signInUrl = `${msAuthEndpoint}/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&response_mode=query&prompt=consent&scope=User.Read`

const oauth = new Hono().get("/signIn", async (ctx) => {
    // Todo: look into adding a state
    // const signInUrl = buildUrl(msAuthEndpoint, {
    //     path: 'authorize',
    //     queryParams: {
    //         client_id: clientId,
    //         response_type: 'code',
    //         redirect_uri: redirectUri,
    //         scope: [].join(' '),
    //         response_mode: 'query',
    //         prompt: 'consent',
    //     }
    // })!
    
    return ctx.redirect(signInUrl);
});

export default oauth;
