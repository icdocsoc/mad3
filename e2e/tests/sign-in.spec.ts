import { expect, test } from '@playwright/test';
import {
  abc,
  mailCount,
  nextMail,
  resetData,
  seedStudent,
  setState,
  shot,
  sql
} from '../helpers/harness';
import { askForCode, signIn } from '../helpers/sign-in';

const desktopOnly = (name: string) =>
  test.skip(name != 'desktop', 'Checked once, on desktop.');

test.beforeEach(() => {
  resetData();
  setState('open');
  abc({});
});

test('a fresher signs in with a code and lands on the portal', async ({
  page
}, info) => {
  seedStudent('jg2426', 'fresher');
  await page.goto('/login');
  await page.screenshot({
    path: shot(`after-02-login-email-${info.project.name}`)
  });
  const code = await askForCode(page, 'jg2426@ic.ac.uk');
  await expect(
    page.getByRole('link', { name: 'tech@docsoc.co.uk' })
  ).toHaveAttribute('href', 'mailto:tech@docsoc.co.uk');
  await page.getByLabel('Code', { exact: true }).fill(code);
  await page.screenshot({
    path: shot(`after-03-login-code-${info.project.name}`)
  });
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/portal/);
  await expect(page.getByRole('heading', { name: 'Hi, jg2426' })).toBeVisible();
  await page.screenshot({
    path: shot(`after-04-portal-fresher-${info.project.name}`)
  });
});

test('capitals and stray spaces in the address are fine', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  seedStudent('jg2426', 'fresher');
  await signIn(page, '  JG2426@IC.AC.UK ');
  await expect(page).toHaveURL(/\/portal/);
});

test('a long-form address is told which address to use', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page
    .getByLabel('Your shortcode', { exact: true })
    .fill('joshua.gonsalves26@imperial.ac.uk');
  await page.getByRole('button', { name: 'Email me a code' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Use your shortcode (like ab1224), not your long first.last email.'
  );
});

test('a whole shortcode address pasted into the box works too', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  seedStudent('jg2426', 'fresher');
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page
    .getByLabel('Your shortcode', { exact: true })
    .fill(' JG2426@ic.ac.uk ');
  await page.getByRole('button', { name: 'Email me a code' }).click();
  await expect(page.getByText('sent to jg2426@ic.ac.uk')).toBeVisible();
});

test('a wrong code says how many tries are left, and five wrong codes end it', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  seedStudent('jg2426', 'fresher');
  const code = await askForCode(page, 'jg2426@ic.ac.uk');
  const wrong = code == '000000' ? '111111' : '000000';

  for (const left of [4, 3, 2, 1]) {
    await page.getByLabel('Code', { exact: true }).fill(wrong);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('alert')).toHaveText(
      `That code isn't right. You have ${left} ${left == 1 ? 'try' : 'tries'} left.`
    );
  }
  await page.screenshot({ path: shot('after-05-wrong-code') });
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Too many wrong codes. Ask for a new one.'
  );

  // The right code is no good now either.
  await page.getByLabel('Code', { exact: true }).fill(code);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'That code has expired. Ask for a new one.'
  );
});

test('an expired code is refused', async ({ page }, info) => {
  desktopOnly(info.project.name);
  seedStudent('jg2426', 'fresher');
  const code = await askForCode(page, 'jg2426@ic.ac.uk');
  sql("update login_codes set expires_at = now() - interval '1 minute';");
  await page.getByLabel('Code', { exact: true }).fill(code);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'That code has expired. Ask for a new one.'
  );
});

test('asking again too soon is refused, and a new code replaces the old one', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  seedStudent('jg2426', 'fresher');
  const first = await askForCode(page, 'jg2426@ic.ac.uk');
  await expect(
    page.getByRole('button', { name: /Send a new code in \d+s/ })
  ).toBeDisabled();

  // Straight to the API, as a double-click or a second tab would.
  const tooSoon = await page.request.post('/api/auth/login', {
    data: { email: 'jg2426@ic.ac.uk' }
  });
  expect(tooSoon.status()).toBe(429);
  expect((await tooSoon.json()).error).toMatch(
    /You can ask for another in \d+ seconds/
  );

  sql("update login_codes set sent_at = now() - interval '2 minutes';");
  const before = mailCount();
  await page.getByRole('button', { name: 'Use a different email' }).click();
  const second = await askForCode(page, 'jg2426@ic.ac.uk');
  expect(before).toBeLessThan(mailCount());

  if (first != second) {
    await page.getByLabel('Code', { exact: true }).fill(first);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page.getByRole('alert')).toContainText(
      "That code isn't right"
    );
  }
  await page.getByLabel('Code', { exact: true }).fill(second);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/portal/);
});

test('the email carries a code and no link, and old links point people to the login page', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  seedStudent('jg2426', 'fresher');
  const before = mailCount();
  await askForCode(page, 'jg2426@ic.ac.uk');
  const mail = await nextMail('jg2426@ic.ac.uk', before);
  expect(mail).not.toMatch(/https?:\/\//);

  await page.goto('/finish-email?token=from-an-old-email');
  await expect(page).toHaveURL(/\/login\?from=link/);
  await expect(
    page.getByText('Sign-in links have been replaced by codes.')
  ).toBeVisible();
  await page.screenshot({ path: shot('after-06-old-link') });
});

test('signing in again while signed in just works', async ({ page }, info) => {
  desktopOnly(info.project.name);
  seedStudent('jg2426', 'fresher');
  await signIn(page, 'jg2426@ic.ac.uk');
  const code = (
    await page.request.post('/api/auth/login', {
      data: { email: 'jg2426@ic.ac.uk' }
    })
  ).ok();
  expect(code).toBe(true);
});

test("someone ABC doesn't know is told what to do, and ABC being down says try again", async ({
  browser,
  page
}, info) => {
  desktopOnly(info.project.name);
  const code = await askForCode(page, 'jg2427@ic.ac.uk');
  await page.getByLabel('Code', { exact: true }).fill(code);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('alert')).toContainText(
    "We couldn't find you as a DoC Computing or JMC student"
  );
  await page.screenshot({ path: shot('after-07-not-found') });

  abc({ down: true, students: ['ab1224'] });
  const parent = await browser.newPage();
  const parentCode = await askForCode(parent, 'ab1224@ic.ac.uk');
  await parent.getByLabel('Code', { exact: true }).fill(parentCode);
  await parent.getByRole('button', { name: 'Log in' }).click();
  await expect(parent.getByRole('alert')).toHaveText(
    "We couldn't check your student record just now. Please try again in a minute."
  );
});

test('a parent ABC knows signs in and is added as a parent', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  abc({ students: ['ab1224'] });
  await signIn(page, 'ab1224@ic.ac.uk');
  expect(sql("select role from student where shortcode = 'ab1224'")).toEqual([
    'parent'
  ]);
});

test('a resitting fresher is a fresher everywhere', async ({ page }, info) => {
  desktopOnly(info.project.name);
  seedStudent('rs1225', 'fresher');
  await signIn(page, 'rs1225@ic.ac.uk');
  const details = await (await page.request.get('/api/auth/details')).json();
  expect(details.user_is).toBe('fresher');
  const propose = await page.request.post('/api/family/propose', {
    data: { shortcode: 'nobody' }
  });
  expect(propose.status()).toBe(403);
});

test('Log In is a link, so it works before the page has finished loading', async ({
  page
}) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Log In' })).toHaveAttribute(
    'href',
    '/login'
  );
});

test('a page that needs you signed in sends you to log in, then back', async ({
  page
}, info) => {
  desktopOnly(info.project.name);
  seedStudent('jg2426', 'fresher');
  await page.goto('/family');
  await expect(page).toHaveURL(/\/login\?next=(%2F|\/)family/);
  await signIn(page, 'jg2426@ic.ac.uk');
  await expect(page).toHaveURL(/\/family/);
});
