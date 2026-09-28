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
import {
  INTEREST_KEYS,
  fillSurvey,
  submitSurveyByApi
} from '../helpers/survey';

const desktopOnly = (name: string) =>
  test.skip(name != 'desktop', 'Checked once, on desktop.');

test.beforeEach(() => {
  resetData();
  setState('open');
  abc({});
});

test('a fresher fills in the survey card by card', async ({ page }, info) => {
  seedStudent('jg2426', 'fresher');
  await signIn(page, 'jg2426@ic.ac.uk');
  await fillSurvey(page, name =>
    page.screenshot({
      path: shot(`after-08-survey-${name}-${info.project.name}`),
      fullPage: true
    })
  );
  await expect(page.getByRole('heading', { name: "You're in!" })).toBeVisible();
  await page.screenshot({
    path: shot(`after-09-survey-done-${info.project.name}`)
  });

  const [row] = sql(
    "select name, preferred_name, jmc, commute, gender, gender_description, drinking, late_nights, societies, meeting_people, instagram, discord, completed_survey from student where shortcode = 'jg2426'"
  );
  expect(row!.split('\t')).toEqual([
    'Joshua Gonsalves',
    'Josh',
    'f',
    'nearby',
    'other',
    'non-binary',
    'round-buyer',
    'one-club-night',
    'few',
    'fine',
    'jgee',
    'jgee',
    't'
  ]);
});

test('the saved interests keep the shape the allocator reads', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  seedStudent('jg2426', 'fresher');
  await signIn(page, 'jg2426@ic.ac.uk');
  await fillSurvey(page);
  await expect(page.getByRole('heading', { name: "You're in!" })).toBeVisible();

  const interests = JSON.parse(
    sql("select interests from student where shortcode = 'jg2426'")[0]!
  );
  // Every key, in the allocator's order, each 0, 1 or 2.
  expect(Object.keys(interests)).toEqual(INTEREST_KEYS);
  expect(
    Object.values(interests).every(score => [0, 1, 2].includes(score as number))
  ).toBe(true);
  // The chips as tapped, and the two worked out from the pub and late-night answers.
  expect(interests).toMatchObject({
    football: 2,
    film: 1,
    alcohol: 2,
    clubbing: 1,
    rugby: 0
  });
});

test('Continue says what is missing before moving on', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  seedStudent('jg2426', 'fresher');
  await signIn(page, 'jg2426@ic.ac.uk');
  await page.goto('/survey');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alert')).toHaveText('Tell us your full name.');
  await page.getByLabel('Full name').fill('Joshua Gonsalves');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alert')).toHaveText('Choose your course.');
  await page.screenshot({ path: shot('after-10-survey-missing') });
});

test('answers can be changed until sign-ups close', async ({ page }, info) => {
  desktopOnly(info.project.name);
  seedStudent('jg2426', 'fresher');
  await signIn(page, 'jg2426@ic.ac.uk');
  await submitSurveyByApi(page, 'Joshua Gonsalves');

  await page.goto('/survey');
  await page.getByRole('button', { name: 'Change my answers' }).click();
  await expect(page.getByLabel('Full name')).toHaveValue('Joshua Gonsalves');
  await page.getByLabel('Full name').fill('Joshua G');
  for (let card = 0; card < 9; card++)
    await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Save my answers' }).click();
  await expect(page.getByRole('heading', { name: "You're in!" })).toBeVisible();
  expect(sql("select name from student where shortcode = 'jg2426'")).toEqual([
    'Joshua G'
  ]);

  setState('closed');
  await page.goto('/survey');
  await expect(
    page.getByRole('heading', { name: 'Sign-ups are closed' })
  ).toBeVisible();
});

test('a parent is sent on to find their partner', async ({ page }, info) => {
  desktopOnly(info.project.name);
  abc({ students: ['pa1224'] });
  await signIn(page, 'pa1224@ic.ac.uk');
  await fillSurvey(page);
  await expect(
    page.getByRole('heading', { name: 'Survey done' })
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Find your partner' })
  ).toHaveAttribute('href', '/proposals');
});
