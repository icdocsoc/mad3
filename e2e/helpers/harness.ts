import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const RUN = resolve(import.meta.dirname, '../.run');
const PG_CONTAINER = 'mad3-e2e-pg';

/** Runs SQL against the e2e database and returns the rows as tab-separated lines. */
export function sql(query: string): string[] {
  const out = execFileSync(
    'docker',
    [
      'exec',
      '-i',
      PG_CONTAINER,
      'psql',
      '-U',
      'admin',
      '-d',
      'postgres',
      '-At',
      '-F',
      '\t',
      '-v',
      'ON_ERROR_STOP=1'
    ],
    { input: query, encoding: 'utf8' }
  );
  return out.split('\n').filter(Boolean);
}

/** Empties every table the app writes to, leaving the schema in place. */
export function resetData() {
  const tables = sql(
    "select tablename from pg_tables where schemaname = 'public' and tablename not like '\\_\\_%'"
  );
  if (tables.length)
    sql(`truncate ${tables.map(t => `"${t}"`).join(', ')} cascade;`);
}

/** Sets the site state, creating the single `meta` row if it is missing. */
export function setState(state: string) {
  sql(
    `insert into meta (id, state) values (1, '${state}') on conflict (id) do update set state = excluded.state;`
  );
}

/** Lists a student the way the ABC seed does. */
export function seedStudent(shortcode: string, role: 'fresher' | 'parent') {
  sql(
    `insert into student (shortcode, role, completed_survey) values ('${shortcode}', '${role}', false) on conflict do nothing;`
  );
}

/** Tells the fake ABC who exists, or that it is down. */
export function abc(state: { students?: string[]; down?: boolean }) {
  writeFileSync(
    resolve(RUN, 'abc.json'),
    JSON.stringify({
      down: state.down ?? false,
      students: state.students ?? []
    })
  );
}

/** How many emails the dev mailer has logged so far, to wait for the next one. */
export function mailCount(): number {
  return (
    readFileSync(resolve(RUN, 'server.log'), 'utf8').match(/Email not sent/g) ??
    []
  ).length;
}

/**
 * The newest email the dev mailer logged to an address, once there are more than `after`.
 * The dev mailer prints them to the server log instead of sending them.
 */
export async function nextMail(to: string, after: number): Promise<string> {
  const until = Date.now() + 15_000;
  while (Date.now() < until) {
    const log = readFileSync(resolve(RUN, 'server.log'), 'utf8');
    const mails = log.split('Email not sent').slice(1);
    const mine = mails.slice(after).filter(mail => mail.includes(`To: ${to}`));
    if (mine.length) return mine.at(-1)!;
    await new Promise(done => setTimeout(done, 250));
  }
  throw new Error(`No email to ${to} arrived.`);
}

/** The sign-in link in an email, if it has one. */
export const linkIn = (mail: string) =>
  /https?:\/\/\S+finish-email\?token=\w+/.exec(mail)?.[0];

/** The sign-in code in an email, if it has one. */
export const codeIn = (mail: string) => /\b(\d{6})\b/.exec(mail)?.[1];

/** Where screenshots for the flows report go. */
export const shot = (name: string) =>
  resolve(import.meta.dirname, '../../docs/flows', `${name}.png`);
