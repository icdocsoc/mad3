import { Hono } from "hono";
import oauth from "./src/auth/oauth";

const app = new Hono()
    .route('/oauth', oauth)

export default app;