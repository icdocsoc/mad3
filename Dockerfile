FROM oven/bun:1.1.29

RUN mkdir -p /etc/ssl/certs/
RUN echo "$PGCERT" > /etc/ssl/certs/postgres.crt
RUN chmod 600 /etc/ssl/certs/postgres.crt
ENV PGCERT_PATH=/etc/ssl/certs/postgres.crt

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --production
COPY . .
RUN bun --bun run build
CMD [ "bun", "run", ".output/server/index.mjs" ]
