import { expect, test, type Page } from '@playwright/test';
import {
  abc,
  resetData,
  seedStudent,
  setState,
  shot,
  sql
} from '../helpers/harness';
import { signIn } from '../helpers/sign-in';
import { FIELDS, FILLED, answersFor, fillSurvey } from '../helpers/survey';

/**
 * Collecting answers is the whole point of MaDs until the new matchmaker takes over, so these
 * check what is stored, however it arrives: through the page, or straight at the API.
 */

const desktopOnly = (name: string) =>
  test.skip(name != 'desktop', 'Checked once, on desktop.');

const stored = (shortcode: string) =>
  JSON.parse(
    sql(`select answers from student where shortcode = '${shortcode}'`)[0] ??
      'null'
  );

const post = (page: Page, answers: Record<string, unknown>) =>
  page.request.post('/api/family/survey', { data: { answers } });

/** Every stored answer is one the survey could have given, in the shape the survey stores. */
function expectValidAgainstSurvey(answers: Record<string, unknown>) {
  for (const [key, value] of Object.entries(answers)) {
    const field = FIELDS[key];
    expect(field, `"${key}" is not a question in mads.json`).toBeDefined();
    if (field!.kind == 'chips') {
      const allowed = field!.groups!.flatMap(group =>
        group.options.map(option => option.value)
      );
      expect(Array.isArray(value)).toBe(true);
      for (const chip of value as string[]) expect(allowed).toContain(chip);
    } else if (
      field!.kind == 'choice' &&
      !field!.options!.some(option => option.free)
    ) {
      expect(field!.options!.map(option => option.value)).toContain(value);
    } else if (field!.kind == 'phone') {
      expect(value).toMatch(/^\+[1-9]\d{6,14}$/);
    } else {
      expect(typeof value).toBe('string');
    }
  }
  for (const [key, field] of Object.entries(FIELDS)) {
    if (field.kind != 'note' && !field.optional)
      expect(answers, `"${key}" is required`).toHaveProperty(key);
  }
}

test.beforeEach(() => {
  resetData();
  setState('open');
  abc({ students: ['pa1224'] });
});

test('a fresher fills in the survey, and every answer is stored as given', async ({
  page
}, info) => {
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

  const answers = stored('jg2426');
  expect(answers).toEqual(FILLED);
  expectValidAgainstSurvey(answers);
  // Stored as a real JSON object, readable straight from the database.
  expect(
    sql("select jsonb_typeof(answers) from student where shortcode = 'jg2426'")
  ).toEqual(['object']);
  // And the columns the rest of mad3 reads, filled from the answers.
  expect(
    sql(
      "select name, jmc, gender, about_me, completed_survey from student where shortcode = 'jg2426'"
    )
  ).toEqual(['Joshua Gonsalves\tf\tother\tHi! I like football.\tt']);
});

test('a parent answers the same questions, stored the same way', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  await signIn(page, 'pa1224@ic.ac.uk');
  await fillSurvey(page);
  await expect(
    page.getByRole('heading', { name: 'Survey done' })
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Find your partner' })
  ).toHaveAttribute('href', '/proposals');
  expect(stored('pa1224')).toEqual({ ...FILLED, shortcode: 'pa1224' });
});

test('the shortcode is filled in, locked, and always the signed-in one', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  seedStudent('jg2426', 'fresher');
  await signIn(page, 'jg2426@ic.ac.uk');
  await page.goto('/survey');
  await expect(page.getByLabel('Imperial shortcode')).toHaveValue('jg2426');
  await expect(page.getByLabel('Imperial shortcode')).not.toBeEditable();

  const response = await post(
    page,
    answersFor('Joshua', { shortcode: 'someone9' })
  );
  expect(response.ok()).toBe(true);
  expect(stored('jg2426').shortcode).toBe('jg2426');
});

test('the API keeps only answers the survey could have given', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  seedStudent('jg2426', 'fresher');
  await signIn(page, 'jg2426@ic.ac.uk');

  // Missing a required answer: refused, and says which card.
  let response = await post(page, answersFor('Joshua', { commute: undefined }));
  expect(response.status()).toBe(400);
  expect((await response.json()).error).toContain('During term I live...');
  expect(stored('jg2426')).toBeNull();

  // An option that doesn't exist is no answer at all.
  response = await post(page, answersFor('Joshua', { commute: 'on the moon' }));
  expect(response.status()).toBe(400);

  // No interests: refused. Made-up interests: dropped.
  response = await post(page, answersFor('Joshua', { interests: [] }));
  expect(response.status()).toBe(400);
  response = await post(
    page,
    answersFor('Joshua', { interests: ['football', 'bribery'] })
  );
  expect(response.ok()).toBe(true);
  expect(stored('jg2426').interests).toEqual(['football']);

  // Unknown questions are dropped; a bad phone number is refused; text is trimmed.
  response = await post(
    page,
    answersFor('  Joshua  ', { password: 'hunter2', instagram: '@jg' })
  );
  expect(response.ok()).toBe(true);
  expect(stored('jg2426')).not.toHaveProperty('password');
  expect(stored('jg2426')).toMatchObject({ name: 'Joshua', instagram: 'jg' });
  response = await post(page, answersFor('Joshua', { phone: '12' }));
  expect(response.status()).toBe(400);
  expect((await response.json()).error).toBe(
    "That phone number doesn't look right."
  );

  // Garbage shapes don't crash anything.
  response = await page.request.post('/api/family/survey', {
    data: { answers: 'nope' }
  });
  expect(response.status()).toBe(400);
  response = await post(
    page,
    answersFor('Joshua', { name: ['a', 'b'], interests: 'football' })
  );
  expect(response.status()).toBe(400);

  expectValidAgainstSurvey(stored('jg2426'));
});

test('each card says what is missing before moving on', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  seedStudent('jg2426', 'fresher');
  await signIn(page, 'jg2426@ic.ac.uk');
  await page.goto('/survey');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Answer "Full name" to carry on.'
  );
  await page.getByLabel('Full name').fill('Joshua Gonsalves');
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Answer "Course" to carry on.'
  );
  await page.screenshot({ path: shot('after-10-survey-missing') });
});

test('answers can be changed until sign-ups close, and nothing is lost on the way', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  seedStudent('jg2426', 'fresher');
  await signIn(page, 'jg2426@ic.ac.uk');
  await fillSurvey(page);
  await expect(page.getByRole('heading', { name: "You're in!" })).toBeVisible();

  await page.getByRole('button', { name: 'Change my answers' }).click();
  await expect(page.getByLabel('Full name')).toHaveValue('Joshua Gonsalves');
  await page.getByLabel('Full name').fill('Joshua G');
  for (let card = 0; card < 9; card++)
    await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page.getByLabel('Phone (optional)')).toHaveValue('07911 123456');
  await page.getByRole('button', { name: 'Save my answers' }).click();
  await expect(page.getByRole('heading', { name: "You're in!" })).toBeVisible();
  expect(stored('jg2426')).toEqual({ ...FILLED, name: 'Joshua G' });

  setState('closed');
  expect((await post(page, answersFor('Too late'))).status()).toBe(403);
  expect(stored('jg2426').name).toBe('Joshua G');
  await page.goto('/survey');
  await expect(
    page.getByRole('heading', { name: 'Sign-ups are closed' })
  ).toBeVisible();
});

test('your own answers come back to you, and nobody else can write them', async ({
  page,
  browser
}, info) => {
  desktopOnly(info.project.name);
  seedStudent('jg2426', 'fresher');
  await signIn(page, 'jg2426@ic.ac.uk');
  await post(page, answersFor('Joshua'));
  const me = await (await page.request.get('/api/family/me')).json();
  expect(me.answers).toMatchObject({ name: 'Joshua', shortcode: 'jg2426' });

  const stranger = await browser.newPage();
  const response = await stranger.request.post('/api/family/survey', {
    data: { answers: answersFor('Evil') }
  });
  expect(response.status()).toBe(401);
  expect(stored('jg2426').name).toBe('Joshua');
});
