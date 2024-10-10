/** After running this script, see the `mailmerge` dir for how to send out emails with allocations. */
import type { Student } from './hono/types';

var csv =
  'id,parent1,parent1shortcode,parent2,parent2shortcode,child1,child1shortcode,child2,child2shortcode,child3,child3shortcode,child4,child4shortcode\n';

const authCookie = prompt(
  "Please insert your auth cookie:\nThis will only be saved in memory to create the CSV.\nSee the README if you're unsure how to get this.\n"
)!;

const req = await fetch(`${process.env.BASE_URL!}/api/admin/all-families`, {
  headers: {
    Cookie: `Authorization=${authCookie}`
  }
})

const allFamilies = await req.json();

for (const family of allFamilies) {
  const familyId = family.id;

  const kidsString = family.kids
    .map((student: Student) => `${student.name},${student.shortcode}`)
    .join(',');

  csv += `${familyId},${family.parents[0].name},${family.parents[0].shortcode},${family.parents[1].name},${family.parents[1].shortcode},${kidsString}\n`;
}

await Bun.write('families.csv', csv);
