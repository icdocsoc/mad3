import { expect, test, type Page } from '@playwright/test';
import {
  abc,
  resetData,
  seedStudent,
  setState,
  shot
} from '../helpers/harness';
import { signIn } from '../helpers/sign-in';

/**
 * The "before" picture for the parts not yet rebuilt: the survey and proposals as deployed.
 * These describe the old behaviour on purpose and go once each part is fixed; sign-in's are
 * now in sign-in.spec.ts.
 */

/** Every browser alert a page has shown, oldest first. */
const alerts = new WeakMap<Page, string[]>();
function alertsOf(page: Page) {
  if (!alerts.has(page)) {
    const said: string[] = [];
    alerts.set(page, said);
    page.on('dialog', dialog => {
      said.push(dialog.message());
      void dialog.accept();
    });
  }
  return alerts.get(page)!;
}

test.beforeEach(() => {
  resetData();
  setState('open');
  abc({});
});

test('the survey on a phone, where social links must be full URLs', async ({
  page
}, info) => {
  test.skip(info.project.name != 'phone', 'The survey is shown on a phone.');
  seedStudent('jg2426', 'fresher');
  await signIn(page, 'jg2426@ic.ac.uk');
  await page.goto('/survey');
  await page.screenshot({
    path: shot('before-07-survey-phone'),
    fullPage: true
  });

  await page.getByRole('button', { name: 'Add Link' }).click();
  await page.getByPlaceholder('https://instagram.com/docsoc').fill('@jg');
  await expect(page.getByText('Invalid')).toBeVisible();
});

test('a parent proposing to a mistyped shortcode gets a browser alert', async ({
  page
}, info) => {
  test.skip(info.project.name != 'desktop', 'Checked once, on desktop.');
  abc({ students: ['pa1224'] });
  await signIn(page, 'pa1224@ic.ac.uk');
  const survey = await page.request.post('/api/family/survey', {
    data: {
      name: 'Pat',
      jmc: false,
      gender: 'n/a',
      interests: Object.fromEntries(
        [
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
        ].map(key => [key, 1])
      ),
      aboutMe: null,
      socials: []
    }
  });
  expect(survey.ok()).toBe(true);

  const said = alertsOf(page);
  await page.goto('/proposals');
  await page.waitForLoadState('networkidle');
  const seen = said.length;
  await page.getByPlaceholder('e.g. nj421').fill('pb1224');
  await page.getByRole('button', { name: 'Propose' }).click();
  await expect.poll(() => said.length).toBeGreaterThan(seen);
  await page.screenshot({ path: shot('before-08-proposals'), fullPage: true });
  expect(said[seen]).toContain('Invalid proposee');
});
