import { expect, test, type Browser, type Page } from '@playwright/test';
import {
  abc,
  linkIn,
  mailCount,
  nextMail,
  resetData,
  seedStudent,
  setState,
  shot,
  sql
} from '../helpers/harness';

/**
 * The "before" picture: mad3 as deployed, walked through the way students hit it. Each test
 * records what actually happens, with a screenshot for the flows report. These describe the
 * old behaviour on purpose and are replaced by the real suite once it is fixed.
 */

const desktopOnly = (name: string) =>
  test.skip(name !== 'desktop', 'Checked once, on desktop.');

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

/** Asks for a sign-in link through the nav's popup, and returns what the page said about it. */
async function askForLink(page: Page, email: string) {
  const all = alertsOf(page);
  const seen = all.length;
  await page.goto('/');
  // "Log In" is a click handler, not a link: it does nothing until the page's script has loaded.
  await page.waitForLoadState('networkidle');
  await page.getByText('Log In', { exact: true }).click();
  await page.getByPlaceholder('xx0000@ic.ac.uk').fill(email);
  await page.getByRole('button', { name: 'Submit' }).click();
  await expect.poll(() => all.length).toBeGreaterThan(seen);
  return all.slice(seen);
}

/** Signs in by asking for a link in one page and opening it in another. */
async function signIn(browser: Browser, email: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const before = mailCount();
  await askForLink(page, email);
  const link = linkIn(await nextMail(email, before))!;
  await page.goto(link);
  await expect(page).toHaveURL(/\/portal/);
  return page;
}

test.beforeEach(() => {
  resetData();
  abc({});
});

test('a fresh database with no site state breaks every page', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  const response = await page.goto('/');
  await page.screenshot({
    path: shot('before-01-no-meta-row'),
    fullPage: true
  });
  expect(response?.status()).toBe(500);
});

test('the login popup refuses capitals and long-form addresses', async ({
  page
}, info) => {
  setState('freshers_open');
  const capitals = await askForLink(page, 'JG2426@ic.ac.uk');
  await page.screenshot({
    path: shot(`before-02-login-popup-${info.project.name}`)
  });
  const longForm = await askForLink(page, 'joshua.gonsalves26@imperial.ac.uk');
  expect(capitals[0]).toContain('Please use your Imperial shortcode email');
  expect(longForm[0]).toContain('Please use your Imperial shortcode email');
});

test('a link used by something else first is gone', async ({
  browser,
  page
}, info) => {
  desktopOnly(info.project.name);
  setState('freshers_open');
  seedStudent('jg2426', 'fresher');
  const before = mailCount();
  await askForLink(page, 'jg2426@ic.ac.uk');
  const link = linkIn(await nextMail('jg2426@ic.ac.uk', before))!;

  // A plain fetch of the link, like a link preview, consumes nothing: the page does it in script.
  expect((await page.request.get(link)).ok()).toBe(true);

  // Anything that runs the page, like a scanner opening it in a browser, uses the link up.
  const scanner = await (await browser.newContext()).newPage();
  await scanner.goto(link);
  await expect(scanner).toHaveURL(/\/portal/);

  await page.goto(link);
  await expect(page.getByText('Invalid or expired token.')).toBeVisible();
  await page.screenshot({
    path: shot('before-03-link-already-used'),
    fullPage: true
  });
});

test('opening the link again after signing in shows an error with no message', async ({
  browser
}, info) => {
  desktopOnly(info.project.name);
  setState('freshers_open');
  seedStudent('jg2426', 'fresher');
  const context = await browser.newContext();
  const page = await context.newPage();
  const before = mailCount();
  await askForLink(page, 'jg2426@ic.ac.uk');
  const link = linkIn(await nextMail('jg2426@ic.ac.uk', before))!;
  await page.goto(link);
  await expect(page).toHaveURL(/\/portal/);

  await page.goto(link);
  await expect(page.getByText('Error:')).toBeVisible();
  await page.screenshot({
    path: shot('before-04-link-opened-twice'),
    fullPage: true
  });
});

test('a link opened in a different browser signs in that browser, not the one that asked', async ({
  browser
}, info) => {
  desktopOnly(info.project.name);
  setState('freshers_open');
  seedStudent('jg2426', 'fresher');
  const asked = await (await browser.newContext()).newPage();
  const before = mailCount();
  await askForLink(asked, 'jg2426@ic.ac.uk');
  const link = linkIn(await nextMail('jg2426@ic.ac.uk', before))!;

  const mailApp = await (await browser.newContext()).newPage();
  await mailApp.goto(link);
  await expect(mailApp).toHaveURL(/\/portal/);

  await asked.reload();
  await expect(asked.getByText('Log In', { exact: true })).toBeVisible();
  await asked.screenshot({
    path: shot('before-05-other-browser-still-signed-out')
  });
});

test('a fresher missing from the seed, or anyone while ABC is down, is told they are not in Computing', async ({
  browser,
  page
}, info) => {
  desktopOnly(info.project.name);
  setState('freshers_open');

  let before = mailCount();
  await askForLink(page, 'jg2427@ic.ac.uk');
  await page.goto(linkIn(await nextMail('jg2427@ic.ac.uk', before))!);
  await expect(
    page.getByText('You are not a Computing student :(')
  ).toBeVisible();
  await page.screenshot({
    path: shot('before-06-unseeded-fresher'),
    fullPage: true
  });

  abc({ down: true, students: ['ab1224'] });
  const parent = await (await browser.newContext()).newPage();
  before = mailCount();
  await askForLink(parent, 'ab1224@ic.ac.uk');
  await parent.goto(linkIn(await nextMail('ab1224@ic.ac.uk', before))!);
  await expect(
    parent.getByText('You are not a Computing student :(')
  ).toBeVisible();
});

test("a resitting fresher's sign-in says parent, so parent-only routes let them in", async ({
  browser
}, info) => {
  desktopOnly(info.project.name);
  setState('freshers_open');
  seedStudent('rs1225', 'fresher');
  const page = await signIn(browser, 'rs1225@ic.ac.uk');

  const details = await (await page.request.get('/api/auth/details')).json();
  expect(details.user_is).toBe('parent');
  const propose = await page.request.post('/api/family/propose', {
    data: { shortcode: 'nobody' }
  });
  expect(propose.status()).not.toBe(403);
  expect(sql("select role from student where shortcode = 'rs1225'")).toEqual([
    'fresher'
  ]);
});

test('the survey on a phone, where social links must be full URLs', async ({
  browser
}, info) => {
  test.skip(info.project.name !== 'phone', 'The survey is shown on a phone.');
  setState('freshers_open');
  seedStudent('jg2426', 'fresher');
  const page = await signIn(browser, 'jg2426@ic.ac.uk');
  await page.setViewportSize({ width: 412, height: 915 });
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
  browser
}, info) => {
  desktopOnly(info.project.name);
  setState('freshers_open');
  abc({ students: ['pa1224'] });
  const page = await signIn(browser, 'pa1224@ic.ac.uk');
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
