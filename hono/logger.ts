import type { Context } from "hono";
import { logger } from "hono/logger";
import pc from "picocolors";

enum Level {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export const apiLogger = {
  debug(ctx: Context, ...messages: [any, ...any[]]): void {
    const level = Level.DEBUG;

    customLogger(
      pc.bgBlue(level),
      pc.bold(ctx.req.path),
      [...messages].join(" -- ")
    );
  },
  info(ctx: Context, ...messages: [any, ...any[]]): void {
    const level = Level.INFO;

    customLogger(
      pc.bgWhite(level),
      pc.bold(ctx.req.path),
      [...messages].join(" -- ")
    );
  },
  warn(ctx: Context, ...messages: [any, ...any[]]): void {
    const level = Level.WARN;

    customLogger(
      pc.bgYellow(level),
      pc.bold(ctx.req.path),
      [...messages].join(" -- ")
    );
  },
  error(ctx: Context, ...messages: [any, ...any[]]): void {
    const level = Level.ERROR;

    customLogger(
      pc.bgRed(level),
      pc.bold(ctx.req.path),
      [...messages].join(" -- ")
    );
  },
};

const customLogger = (message: string, ...rest: string[]) => {
  const date = new Date();
  console.log(pc.yellow(date.toISOString()), message, ...rest);
};

export default () => logger(customLogger);
