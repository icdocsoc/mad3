import { expect, type Page } from '@playwright/test';

/** The allocator's 27 interest keys, in the order it reads them (hono/types.ts). */
export const INTEREST_KEYS = [
  'alcohol',
  'anime',
  'artGraphics',
  'baking',
  'charity',
  'clubbing',
  'cooking',
  'danceBallroom',
  'danceContemporary',
  'dramatics',
  'exerciseAndHealth',
  'film',
  'finance',
  'football',
  'hiking',
  'kpop',
  'martialArts',
  'otherSports',
  'performingMusicClassical',
  'performingMusicPopRockJazz',
  'photography',
  'politics',
  'racketSports',
  'rowing',
  'rugby',
  'tabletopGames',
  'videoGames'
];

/** A complete set of answers, sent straight to the API, for tests that are about later steps. */
export function answersFor(
  name: string,
  overrides: Record<string, unknown> = {}
) {
  const chips = Object.fromEntries(
    INTEREST_KEYS.filter(key => key != 'alcohol' && key != 'clubbing').map(
      key => [key, 0]
    )
  );
  return {
    name,
    preferredName: null,
    jmc: false,
    commute: 'halls',
    gender: 'n/a',
    genderDescription: null,
    drinking: 'couple',
    lateNights: 'home-by-midnight',
    interests: { ...chips, football: 2, film: 1 },
    societies: 'few',
    meetingPeople: 'fine',
    aboutMe: null,
    instagram: null,
    discord: null,
    phone: null,
    ...overrides
  };
}

export async function submitSurveyByApi(page: Page, name: string) {
  const response = await page.request.post('/api/family/survey', {
    data: answersFor(name)
  });
  expect(response.ok()).toBe(true);
}

const choose = (page: Page, label: string) =>
  page.getByRole('radio', { name: label, exact: true }).check();

const next = (page: Page) =>
  page.getByRole('button', { name: 'Continue' }).click();

/** Fills the survey in through the page, card by card, the way a student would. */
export async function fillSurvey(
  page: Page,
  shots?: (name: string) => Promise<unknown>
) {
  await page.goto('/survey');
  await page.waitForLoadState('networkidle');

  await page.getByLabel('Full name').fill('Joshua Gonsalves');
  await page.getByLabel('Preferred name (optional)').fill('Josh');
  await choose(page, 'Computing');
  await shots?.('you');
  await next(page);

  await expect(
    page.getByText('deterministic matchmaking algorithm')
  ).toBeVisible();
  await next(page);

  await choose(page, 'Half an hour commute');
  await next(page);

  await choose(page, 'I am...');
  await page.getByLabel('I am...', { exact: true }).last().fill('non-binary');
  await next(page);

  await choose(page, "Yippee! I'll get the first round.");
  await next(page);

  await choose(page, "I'll tag along to some afterparties~");
  await next(page);

  await page.getByRole('button', { name: 'Football', exact: true }).click();
  await page.getByRole('button', { name: /^Football/ }).click();
  await page.getByRole('button', { name: 'Films', exact: true }).click();
  await shots?.('interests');
  await next(page);

  await choose(page, 'A few I care about');
  await next(page);

  await choose(page, "I'm fine once I'm there");
  await next(page);

  await page.getByLabel('Instagram').fill('@jgee');
  await page.getByLabel('Discord').fill('jgee');
  await shots?.('intro');
  await page
    .getByRole('button', { name: /^(Submit|Save my answers)$/ })
    .click();
}
