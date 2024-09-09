import { Hono } from "hono";
import oauth from "./src/oauth";

const app = new Hono()
    .route('/oauth', oauth)

export default app;