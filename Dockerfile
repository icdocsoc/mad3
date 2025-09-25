FROM oven/bun:1.2.22

ARG WEBMASTERS
ENV WEBMASTERS $WEBMASTERS

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --production
COPY . .
RUN bun --bun run build
CMD [ "bun", "run", ".output/server/index.mjs" ]
