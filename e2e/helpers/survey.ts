import { expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** The survey as mad3 asks it: a copy of the monorepo's mads.json. */
export const MADS = JSON.parse(
  readFileSync(
    resolve(import.meta.dirname, '../../hono/survey/mads.json'),
    'utf8'
  )
) as {
  stages: {
    id: string;
    title: string;
    fields: Record<
      string,
      {
        kind: string;
        optional?: boolean;
        options?: { value: string; free?: boolean }[];
        groups?: { options: { value: string }[] }[];
      }
    >;
  }[];
};

/** The version of mads.json, which submitted answers record. */
export const MADS_VERSION = (MADS as unknown as { version: number }).version;

export const FIELDS = Object.fromEntries(
  MADS.stages.flatMap(stage => Object.entries(stage.fields))
);

/** A complete, valid set of answers, sent straight to the API, for tests about later steps. */
export function answersFor(
  name: string,
  overrides: Record<string, unknown> = {}
) {
  return {
    name,
    course: 'computing',
    commute: 'halls',
    gender: 'unsaid',
    drinking: 'couple',
    lateNights: 'home-by-midnight',
    interests: ['football', 'film'],
    societies: 'few',
    meetingPeople: 'fine',
    ...overrides
  };
}

export async function submitSurveyByApi(page: Page, name: string) {
  const response = await page.request.post('/api/family/survey', {
    data: { answers: answersFor(name) }
  });
  expect(response.ok(), await response.text()).toBe(true);
}

/** Picks an option by its label, or by a pattern for one worded differently for parents. */
const choose = (page: Page, label: string | RegExp) =>
  page.getByRole('radio', { name: label, exact: true }).check();

const next = (page: Page) =>
  page.getByRole('button', { name: 'Continue' }).click();

/** What fillSurvey types in, as the survey should store it for jg2426. */
export const FILLED = {
  name: 'Joshua Gonsalves',
  preferredName: 'Josh',
  shortcode: 'jg2426',
  course: 'computing',
  commute: 'nearby',
  gender: 'non-binary',
  drinking: 'round-buyer',
  lateNights: 'one-club-night',
  interests: ['football', 'film'],
  societies: 'few',
  meetingPeople: 'fine',
  bio: 'Hi! I like football.',
  instagram: 'jgee',
  discord: 'jgee',
  phone: '+447911123456'
};

/** Fills the survey in through the page, card by card, the way a student would. */
export async function fillSurvey(
  page: Page,
  shots?: (name: string) => Promise<unknown>
) {
  await page.goto('/survey');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Full name').fill('Joshua Gonsalves');
  await page.getByLabel('Preferred name').fill('Josh');
  await choose(page, 'Computing');
  await shots?.('you');
  await next(page);

  await expect(
    page.getByText('deterministic matchmaking algorithm')
  ).toBeVisible();
  await next(page);

  await choose(page, 'Living around West London');
  await next(page);

  await choose(page, 'I am...');
  await page.getByRole('textbox', { name: 'I am...' }).fill('non-binary');
  await next(page);

  await choose(page, 'Race them downing pints');
  await next(page);

  await choose(page, 'Up for it every now and then');
  await next(page);

  await page.getByRole('button', { name: 'Football', exact: true }).click();
  await page.getByRole('button', { name: 'Films', exact: true }).click();
  await shots?.('interests');
  await next(page);

  await choose(page, /^A few I care about, happy to/);
  await next(page);

  await choose(page, "I'm fine once I'm there");
  await next(page);

  await page.getByLabel('A bit about me').fill('Hi! I like football.');
  await page.getByLabel('Instagram').fill('@jgee');
  await page.getByLabel('Discord').fill('jgee');
  await page.getByLabel('Phone (optional)').fill('07911 123456');
  await shots?.('intro');
  await page
    .getByRole('button', { name: /^(Submit|Save my answers)$/ })
    .click();
}
