# Match the Bun that wrote bun.lockb: older versions can't read a newer lockfile.
FROM oven/bun:1.3.3

ARG WEBMASTERS
ENV WEBMASTERS=$WEBMASTERS

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --production
COPY . .
RUN bun --bun run build
# Migrations run on every start, before the server, so a deploy is never ahead of its database.
CMD [ "sh", "-c", "bun scripts/migrate.ts && bun run .output/server/index.mjs" ]
