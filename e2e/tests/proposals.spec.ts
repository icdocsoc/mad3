import { expect, test, type Browser, type Page } from '@playwright/test';
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

/** A page that fails the test if it ever shows a browser dialog. */
function noDialogs(page: Page) {
  page.on('dialog', dialog => {
    throw new Error(`Unexpected browser dialog: ${dialog.message()}`);
  });
  return page;
}

async function parent(browser: Browser, shortcode: string, name: string) {
  const page = noDialogs(await (await browser.newContext()).newPage());
  await signIn(page, `${shortcode}@ic.ac.uk`);
  await submitSurveyByApi(page, name);
  return page;
}

test.beforeEach(() => {
  resetData();
  setState('open');
  abc({ students: ['pa1224', 'pb1224', 'pc1224'] });
});

test('two parents pair up, and the waiting one sees it without reloading', async ({
  browser
}, info) => {
  const pat = await parent(browser, 'pa1224', 'Pat Parent');
  const bea = await parent(browser, 'pb1224', 'Bea Parent');

  await pat.goto('/proposals');
  await pat.waitForLoadState('networkidle');
  await pat.getByLabel("Your partner's shortcode").fill('PB1224');
  await pat.getByRole('button', { name: 'Propose' }).click();
  await expect(pat.getByText('Bea Parent (pb1224)')).toBeVisible();
  await expect(pat.getByText('waiting for them to accept')).toBeVisible();
  await pat.screenshot({
    path: shot(`after-11-proposal-sent-${info.project.name}`),
    fullPage: true
  });

  await bea.goto('/proposals');
  await bea.waitForLoadState('networkidle');
  await expect(bea.getByText('Pat Parent (pa1224)')).toBeVisible();
  await bea.getByRole('button', { name: 'Accept' }).click();
  await expect(bea.getByText('Become parents together?')).toBeVisible();
  await bea.screenshot({
    path: shot(`after-12-proposal-confirm-${info.project.name}`)
  });
  await bea.getByRole('button', { name: 'Yes, accept' }).click();
  await expect(
    bea.getByRole('heading', { name: "It's a match!" })
  ).toBeVisible();
  await bea.screenshot({
    path: shot(`after-13-match-${info.project.name}`),
    fullPage: true
  });

  // Pat's page catches up on its own, within one refresh.
  await expect(pat.getByRole('heading', { name: "It's a match!" })).toBeVisible(
    { timeout: 20_000 }
  );
  expect(sql('select parent1, parent2 from marriage')).toEqual([
    'pb1224\tpa1224'
  ]);
});

test('every mistake is explained on the page', async ({ browser }, info) => {
  desktopOnly(info.project.name);
  seedStudent('fr1226', 'fresher');
  const pat = await parent(browser, 'pa1224', 'Pat Parent');
  await pat.goto('/proposals');
  await pat.waitForLoadState('networkidle');

  const propose = async (shortcode: string) => {
    await pat.getByLabel("Your partner's shortcode").fill(shortcode);
    await pat.getByRole('button', { name: 'Propose' }).click();
    return pat.getByRole('alert');
  };

  await expect(await propose('zz9999')).toHaveText(
    'Nobody with the shortcode zz9999 has signed in yet. Check the spelling, or ask them to log in first.'
  );
  await pat.screenshot({ path: shot('after-14-proposal-mistake') });
  await expect(await propose('fr1226')).toHaveText(
    "fr1226 is signed up as a fresher, so they can't be a parent."
  );
  await expect(await propose('pa1224')).toHaveText(
    "I'm glad you love yourself, but the kids need two parents."
  );
});

test('a proposal can be taken back', async ({ browser }, info) => {
  desktopOnly(info.project.name);
  const pat = await parent(browser, 'pa1224', 'Pat Parent');
  await parent(browser, 'pb1224', 'Bea Parent');
  await pat.goto('/proposals');
  await pat.waitForLoadState('networkidle');
  await pat.getByLabel("Your partner's shortcode").fill('pb1224');
  await pat.getByRole('button', { name: 'Propose' }).click();
  await pat.getByRole('button', { name: 'Take back' }).click();
  await expect(
    pat.getByText("You haven't proposed to anyone yet.")
  ).toBeVisible();
  expect(sql('select count(*) from proposals')).toEqual(['0']);
});

test("someone who already has a partner can't be proposed to", async ({
  browser
}, info) => {
  desktopOnly(info.project.name);
  await parent(browser, 'pa1224', 'Pat Parent');
  await parent(browser, 'pb1224', 'Bea Parent');
  sql("insert into marriage (parent1, parent2) values ('pa1224', 'pb1224');");
  const cai = await parent(browser, 'pc1224', 'Cai Parent');
  await cai.goto('/proposals');
  await cai.waitForLoadState('networkidle');
  await cai.getByLabel("Your partner's shortcode").fill('pb1224');
  await cai.getByRole('button', { name: 'Propose' }).click();
  await expect(cai.getByRole('alert')).toHaveText(
    'pb1224 already has a partner.'
  );
});

test('freshers are sent back to the portal from proposals', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  seedStudent('fr1226', 'fresher');
  await signIn(page, 'fr1226@ic.ac.uk');
  await page.goto('/proposals');
  await expect(page).toHaveURL(/\/portal/);
});

test('two parents accepting each other at the same moment make one family, not two', async ({
  browser
}, info) => {
  desktopOnly(info.project.name);
  const pat = await parent(browser, 'pa1224', 'Pat Parent');
  const bea = await parent(browser, 'pb1224', 'Bea Parent');
  for (const [from, to] of [
    [pat, 'pb1224'],
    [bea, 'pa1224']
  ] as const) {
    const sent = await from.request.post('/api/family/propose', {
      data: { shortcode: to }
    });
    expect(sent.ok()).toBe(true);
  }

  const [patAccepts, beaAccepts] = await Promise.all([
    pat.request.post('/api/family/acceptProposal', {
      data: { shortcode: 'pb1224' }
    }),
    bea.request.post('/api/family/acceptProposal', {
      data: { shortcode: 'pa1224' }
    })
  ]);
  expect([patAccepts.status(), beaAccepts.status()].sort()).toEqual([200, 409]);
  expect(sql('select count(*) from marriage')).toEqual(['1']);
  expect(sql('select count(*) from proposals')).toEqual(['0']);
});

test('a double-tapped proposal is sent once', async ({ browser }, info) => {
  desktopOnly(info.project.name);
  const pat = await parent(browser, 'pa1224', 'Pat Parent');
  await parent(browser, 'pb1224', 'Bea Parent');
  const taps = await Promise.all(
    [1, 2].map(() =>
      pat.request.post('/api/family/propose', { data: { shortcode: 'pb1224' } })
    )
  );
  for (const tap of taps) expect(tap.status()).toBeLessThan(500);
  expect(sql('select count(*) from proposals')).toEqual(['1']);
});

test('proposals stop when sign-ups close, and pairs stay as they were', async ({
  browser
}, info) => {
  desktopOnly(info.project.name);
  const pat = await parent(browser, 'pa1224', 'Pat Parent');
  await parent(browser, 'pb1224', 'Bea Parent');
  await pat.request.post('/api/family/propose', {
    data: { shortcode: 'pb1224' }
  });
  setState('closed');
  const late = await pat.request.post('/api/family/propose', {
    data: { shortcode: 'pc1224' }
  });
  expect(late.status()).toBe(403);
  expect(sql('select proposer, proposee from proposals')).toEqual([
    'pa1224\tpb1224'
  ]);
});

test("each pair and both parents' answers are ready for the matchmaker", async ({
  browser
}, info) => {
  desktopOnly(info.project.name);
  abc({ students: ['pa1224', 'pb1224', 'jg2423'] });
  const pat = await parent(browser, 'pa1224', 'Pat Parent');
  const bea = await parent(browser, 'pb1224', 'Bea Parent');
  await pat.request.post('/api/family/propose', {
    data: { shortcode: 'pb1224' }
  });
  await bea.request.post('/api/family/acceptProposal', {
    data: { shortcode: 'pa1224' }
  });

  // What the committee (and later the matchmaker) reads: every pair, with both parents' answers.
  const admin = await (await browser.newContext()).newPage();
  await signIn(admin, 'jg2423@ic.ac.uk');
  const families = await (
    await admin.request.get('/api/admin/all-families')
  ).json();
  expect(families).toHaveLength(1);
  const shortcodes = families[0].parents
    .map((one: { shortcode: string }) => one.shortcode)
    .sort();
  expect(shortcodes).toEqual(['pa1224', 'pb1224']);
  for (const one of families[0].parents) {
    expect(one.answers).toMatchObject({
      shortcode: one.shortcode,
      course: 'computing'
    });
    expect(one.answers.interests.length).toBeGreaterThan(0);
  }
});
