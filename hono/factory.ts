import { type Env } from "./types";
import { createFactory } from "hono/factory";

export default createFactory<Env>();
