import { expect, type Page } from '@playwright/test';
import { codeIn, mailCount, nextMail } from './harness';

/** Asks for a code on the login page, and returns the code the email carried. */
export async function askForCode(page: Page, email: string) {
  if (!page.url().includes('/login')) await page.goto('/login');
  await page.waitForLoadState('networkidle');
  const before = mailCount();
  await page.getByLabel('Your shortcode email').fill(email);
  await page.getByRole('button', { name: 'Email me a code' }).click();
  await expect(page.getByLabel('Code', { exact: true })).toBeVisible();
  return codeIn(await nextMail(email.trim().toLowerCase(), before))!;
}

/** Signs in through the login page, the way a student would. */
export async function signIn(page: Page, email: string) {
  const code = await askForCode(page, email);
  await page.getByLabel('Code', { exact: true }).fill(code);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).not.toHaveURL(/\/login/);
}
