import { Hono } from "hono";
import oauth from "./auth/oauth";
import { decodeToken } from "./auth/jwt";
import factory from "./factory";

const app = factory.createApp()
.use(decodeToken)
.route('/oauth', oauth)

export default app;