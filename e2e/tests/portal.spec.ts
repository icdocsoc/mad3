import { expect, test } from '@playwright/test';
import {
  abc,
  resetData,
  seedStudent,
  setState,
  shot,
  sql
} from '../helpers/harness';
import { signIn } from '../helpers/sign-in';
import { submitSurveyByApi } from '../helpers/survey';

const desktopOnly = (name: string) =>
  test.skip(name != 'desktop', 'Checked once, on desktop.');

test.beforeEach(() => {
  resetData();
  setState('open');
  abc({ students: ['pa1224', 'pb1224', 'jg2423'] });
});

test("the portal shows a parent what's done and what's next", async ({
  page
}, info) => {
  await signIn(page, 'pa1224@ic.ac.uk');
  await expect(
    page.getByRole('link', { name: 'fill in the survey' })
  ).toBeVisible();

  await submitSurveyByApi(page, 'Pat Parent');
  await page.reload();
  await expect(
    page.getByRole('link', { name: 'Propose to your partner' })
  ).toBeVisible();
  await page.screenshot({
    path: shot(`after-15-portal-parent-${info.project.name}`)
  });

  seedStudent('pb1224', 'parent');
  sql(
    "update student set name = 'Bea Parent', completed_survey = true where shortcode = 'pb1224';"
  );
  sql("insert into marriage (parent1, parent2) values ('pa1224', 'pb1224');");
  await page.reload();
  await expect(page.getByText("You're parents with Bea Parent.")).toBeVisible();
});

test('a fresher sees their family once it is allocated', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  seedStudent('fr1226', 'fresher');
  await signIn(page, 'fr1226@ic.ac.uk');
  await submitSurveyByApi(page, 'Fran Fresher');
  await page.goto('/family');
  await expect(page.getByText("You don't have a family yet.")).toBeVisible();

  for (const [shortcode, name] of [
    ['pa1224', 'Pat Parent'],
    ['pb1224', 'Bea Parent']
  ]) {
    seedStudent(shortcode!, 'parent');
    sql(
      `update student set name = '${name}', completed_survey = true, instagram = 'pat_ig', interests = '{"football":2}' where shortcode = '${shortcode}';`
    );
  }
  sql(
    "insert into marriage (id, parent1, parent2) values (7, 'pa1224', 'pb1224'); insert into family (kid, id) values ('fr1226', 7);"
  );
  await page.goto('/portal');
  await expect(page.getByRole('link', { name: 'Meet them' })).toBeVisible();
  await page.goto('/family');
  await expect(page.getByRole('heading', { name: 'Pat Parent' })).toBeVisible();
  await expect(
    page.getByRole('link', { name: '@pat_ig' }).first()
  ).toBeVisible();
  await page.screenshot({ path: shot('after-16-family'), fullPage: true });
});

test('an admin changes the state with one extra click, and finds families', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  await signIn(page, 'jg2423@ic.ac.uk');
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'closed', exact: true }).click();
  await expect(page.getByText('for everyone?')).toBeVisible();
  await page.screenshot({ path: shot('after-17-admin-state') });
  await page.getByRole('button', { name: 'Yes, change it' }).click();
  await expect(page.getByText('Current state: closed')).toBeVisible();
  expect(sql('select state from meta')).toEqual(['closed']);
});

test('a missing page and a page that is not yours say what to do', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  await page.goto('/no-such-page');
  await expect(
    page.getByText("We couldn't find the page you're looking for.")
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Back to the home page' })
  ).toBeVisible();
});

test('logging out signs you out', async ({ page }, info) => {
  desktopOnly(info.project.name);
  seedStudent('fr1226', 'fresher');
  await signIn(page, 'fr1226@ic.ac.uk');
  await page.getByRole('button', { name: 'Log Out' }).click();
  await expect(page.getByRole('link', { name: 'Log In' })).toBeVisible();
  expect((await page.request.get('/api/family/me')).status()).toBe(401);
});
