import { Hono } from "hono";
import oauth from "./auth/oauth";

const app = new Hono()
    .route('/oauth', oauth)

export default app;