import { Hono } from "hono";
import oauth from "./src/oauth/oauth";

const app = new Hono()
    .route('/oauth', oauth)

export default app;