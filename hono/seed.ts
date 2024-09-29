import { db } from './db';
import { students } from './family/schema';
import { meta } from './admin/schema';

const now = new Date();
const academicYear =
  now.getFullYear() - Math.floor(now.getFullYear() / 100) * 100;
const baseUrl = `https://abc-api.doc.ic.ac.uk/${academicYear}${academicYear + 1}`;

// This is purely to ensure that you have the env file set up properly,
// otherwise we'll make unnecessary calls to the ABC api.
await db.select().from(meta);

// Add all first years, so that we don't make a resit student into a parent.
// (any student redoing a first year module is a fresher)
console.log(
  `The following information is required to authorize you for the ABC API. You have the source code, so you can see it is only ever stored in memory.`
);
const shortcode = prompt('Shortcode: ');
const password = prompt('Password: ');

const authToken = btoa(`${shortcode}:${password}`);
const authHeader = `Basic ${authToken}`;

console.log('--- Getting & filtering modules... ---');
// Get modules that C1 & J1 can take
const modulesReq = await fetch(
  `${baseUrl}/modules?term=1&cohort=c1&cohort=j1`,
  {
    headers: {
      Authorization: authHeader
    }
  }
);
const modulesRes = (await modulesReq.json()) as any[];

// Filter to be the modules that ONLY first years take.
const modules = modulesRes.filter(
  m =>
    (m.applicable_cohorts.length == 1 &&
      (m.applicable_cohorts[0] == 'j1' || m.applicable_cohorts[0] == 'c1')) ||
    (m.applicable_cohorts.length == 2 &&
      (m.applicable_cohorts.includes('j1') ||
        m.applicable_cohorts.includes('c1')))
);
console.log('--- Modules got! ---');

console.log('--- Getting all freshers... ---');
const studentsSet = new Set() as Set<string>;
for (const module of modules) {
  const studentsReq = await fetch(
    `${baseUrl}/modules/${module.code}/enrolled`,
    {
      headers: {
        Authorization: authHeader
      }
    }
  );
  const moduleStudents = await studentsReq.json();
  for (const student of moduleStudents) studentsSet.add(student.login);
}
console.log('--- Freshers got! ---');

console.log('--- Adding freshers to the db... ---');
for (const student of studentsSet) {
  try {
    await db.insert(students).values({
      shortcode: student,
      role: 'fresher',
      completedSurvey: false
    });
  } catch {
    console.log(
      `${student} has already signed in & thus been created an account.`
    );
  }
}
console.log('--- Freshers added! ---');

console.log('--- Adding state to the db...');
// Add the required meta values for state
await db.insert(meta).values({
  id: 1,
  state: 'parents_open'
});
console.log('--- State added! ---');
