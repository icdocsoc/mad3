import { execSync, spawn } from 'node:child_process';
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync
} from 'node:fs';
import { createServer } from 'node:http';
import { join, resolve } from 'node:path';

/**
 * Brings up everything mad3 needs, from nothing, for every run:
 * a fresh Postgres in Docker, a fake ABC API, and the Nuxt dev server.
 * The dev mailer logs emails instead of sending them, so the server's
 * output is written to `.run/server.log` for the tests to read.
 */

const ROOT = resolve(import.meta.dirname, '../..');
const RUN = resolve(import.meta.dirname, '../.run');
export const PG_CONTAINER = 'mad3-e2e-pg';
const PG_PORT = 55433;
const ABC_PORT = 55434;

function waitFor(check: () => boolean, what: string, seconds: number) {
  const until = Date.now() + seconds * 1000;
  while (Date.now() < until) {
    if (check()) return;
    execSync('sleep 1');
  }
  throw new Error(`Timed out waiting for ${what}.`);
}

function tryRun(command: string) {
  try {
    execSync(command, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function startPostgres() {
  tryRun(`docker rm -f ${PG_CONTAINER}`);
  // Until mad3 has a migrate script, migrations are applied the way compose.yaml does it:
  // as Postgres first-start scripts.
  const initdb = existsSync(join(ROOT, 'scripts/migrate.ts'))
    ? ''
    : `-v ${join(ROOT, 'drizzle')}:/docker-entrypoint-initdb.d`;
  execSync(
    `docker run -d --name ${PG_CONTAINER} -p ${PG_PORT}:5432 ` +
      `-e POSTGRES_USER=admin -e POSTGRES_PASSWORD=rootpasswd -e POSTGRES_DB=postgres ${initdb} postgres:16`,
    { stdio: 'pipe' }
  );
  // On first start the image runs a temporary server on a local socket only, then restarts.
  // Only a query over TCP proves the real server is up.
  waitFor(
    () =>
      tryRun(
        `docker exec ${PG_CONTAINER} psql -h 127.0.0.1 -U admin -d postgres -c "select 1"`
      ),
    'Postgres',
    60
  );
  if (!initdb) execSync('bun run db:migrate', { cwd: ROOT, stdio: 'inherit' });
  else
    waitFor(
      () =>
        tryRun(
          `docker exec ${PG_CONTAINER} psql -U admin -d postgres -c "select 1 from student"`
        ),
      'the migrations',
      60
    );
}

/** A stand-in for ABC's identity endpoint, driven by `.run/abc.json`. */
function startFakeAbc() {
  const server = createServer((req, res) => {
    const state = JSON.parse(readFileSync(join(RUN, 'abc.json'), 'utf8')) as {
      down: boolean;
      students: string[];
    };
    const login = new URL(req.url ?? '/', 'http://abc').searchParams.get(
      'login'
    );
    if (state.down) return res.writeHead(503).end('ABC is down');
    if (login && state.students.includes(login))
      return res
        .writeHead(200, { 'Content-Type': 'application/json' })
        .end(JSON.stringify({ login }));
    return res.writeHead(404).end('Not found');
  });
  server.listen(ABC_PORT);
  return server;
}

async function startDevServer() {
  const log = createWriteStream(join(RUN, 'server.log'));
  const server = spawn('bun', ['--bun', 'run', 'dev'], {
    cwd: ROOT,
    env: { ...process.env, NODE_ENV: 'development' }
  });
  server.stdout.pipe(log);
  server.stderr.pipe(log);

  const until = Date.now() + 180_000;
  while (Date.now() < until) {
    try {
      await fetch('http://localhost:3000/api/admin/state');
      return server;
    } catch {
      await new Promise(done => setTimeout(done, 1000));
    }
  }
  server.kill();
  throw new Error('Timed out waiting for the dev server.');
}

export default async function globalSetup() {
  mkdirSync(RUN, { recursive: true });
  execSync(`printf '{"down":false,"students":[]}' > ${join(RUN, 'abc.json')}`);

  startPostgres();
  const abc = startFakeAbc();
  const server = await startDevServer();

  return async () => {
    server.kill();
    abc.close();
    if (!process.env.E2E_KEEP_DB) tryRun(`docker rm -f ${PG_CONTAINER}`);
  };
}
