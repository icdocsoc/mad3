import { expect, test } from '@playwright/test';
import { resetData, setState, shot, sql } from '../helpers/harness';

test.beforeEach(() => resetData());

test('a freshly migrated database has the site state it needs', () => {
  // The migration creates this row; the ABC seed used to be the only thing that did.
  expect(sql('select id from meta')).toEqual(['1']);
});

test('the landing page says when sign-ups are closed', async ({
  page
}, info) => {
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page.getByText('Sign-ups are closed.')).toBeVisible();
  await page.screenshot({
    path: shot(`after-01-landing-closed-${info.project.name}`)
  });
});

test('the landing page says when sign-ups are open', async ({ page }) => {
  setState('open');
  await page.goto('/');
  await expect(page.getByText('Sign-ups are open!')).toBeVisible();
});
