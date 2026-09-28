import { parseArgs } from 'util';
import { and, eq, inArray } from 'drizzle-orm';
import { db, pool } from './db';
import { meta } from './admin/schema';
import { students } from './family/schema';
import { academicYear } from './auth/jwt';

const {
  values: { push }
} = parseArgs({
  args: Bun.argv,
  options: {
    push: {
      type: 'boolean',
      default: false
    }
  },
  strict: true,
  allowPositionals: true
});

const year = academicYear();
const baseUrl = `${process.env.ABC_API_BASE}/${year}${year + 1}`;

// ABC only knows a year's freshers once that academic year has started, so run this from
// September. Before then it would list last year's freshers.
console.log(`Finding the freshers of 20${year}-${year + 1}.`);

if (push) {
  // This is purely to ensure that you have the env file set up properly,
  // otherwise we'll make unnecessary calls to the ABC api.
  await db.select().from(meta);
}

// Add all first years, so that we don't make a resit student into a parent.
// (any student redoing a first year module is a fresher)
console.log(
  `The following information is required to authorize you for the ABC API. You have the source code, so you can see it is only ever stored in memory.`
);
const shortcode = prompt('Shortcode: ');
const password = prompt('Password: ');

const authToken = btoa(`${shortcode}:${password}`);
const authHeader = `Basic ${authToken}`;

async function fromAbc<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`, {
    headers: { Authorization: authHeader }
  });
  if (!res.ok) {
    throw new Error(
      `ABC answered ${res.status} for ${path}. ${res.status == 401 ? 'Check your shortcode and password.' : ''}`
    );
  }
  return (await res.json()) as T;
}

console.log('--- Getting & filtering modules... ---');
// Get modules that C1 & J1 can take
const modulesRes = await fromAbc<
  { code: string; applicable_cohorts: string[] }[]
>('/modules?term=1&cohort=c1&cohort=j1');

// Only modules no one but first years takes: one shared with a later year would bring its
// students in as freshers.
const FIRST_YEARS = ['c1', 'j1'];
const modules = modulesRes.filter(
  m =>
    m.applicable_cohorts.length > 0 &&
    m.applicable_cohorts.every(cohort => FIRST_YEARS.includes(cohort))
);
if (!modules.length) throw new Error('ABC listed no first-year modules.');
console.log(`--- ${modules.length} modules got! ---`);

const allStudents: {
  shortcode: string;
  firstName: string;
  lastName: string;
  email: string;
}[] = [];
console.log('--- Getting all freshers... ---');
for (const module of modules) {
  const moduleStudents = await fromAbc<
    { login: string; firstname: string; lastname: string; email: string }[]
  >(`/modules/${module.code}/enrolled`);
  for (const student of moduleStudents) {
    if (allStudents.find(s => s.shortcode == student.login)) continue;
    allStudents.push({
      shortcode: student.login,
      firstName: student.firstname,
      lastName: student.lastname,
      email: student.email
    });
  }
}
console.log(`--- ${allStudents.length} freshers got! ---`);

// If push, add to database, else write to file.
if (push) {
  console.log('--- Adding freshers to the db... ---');
  const added = await db
    .insert(students)
    .values(
      allStudents.map(student => ({
        shortcode: student.shortcode,
        role: 'fresher' as const,
        completedSurvey: false
      }))
    )
    .onConflictDoNothing()
    .returning({ shortcode: students.shortcode });
  console.log(`--- ${added.length} freshers added! ---`);

  // Someone who signed in before this ran was given a role from their email, and keeps it.
  // A resit student signed in that way is a parent, so the committee should check them.
  const parents = await db
    .select({ shortcode: students.shortcode })
    .from(students)
    .where(
      and(
        eq(students.role, 'parent'),
        inArray(
          students.shortcode,
          allStudents.map(student => student.shortcode)
        )
      )
    );
  if (parents.length) {
    console.log(
      `These freshers already signed in as parents, so their role was not changed: ${parents.map(row => row.shortcode).join(', ')}`
    );
  }
}
console.log('--- Writing JSON to file... ---');

await Bun.write('students.json', JSON.stringify(allStudents, null, 2));

console.log('--- Wrote JSON to file! ---');
await pool.close();
