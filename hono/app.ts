import { Hono } from "hono";
import oauth from "./auth/oauth";
import { decodeToken } from "./auth/jwt";

const app = new Hono()
    .use(decodeToken)
    .route('/oauth', oauth)

export default app;