import { expect, test, type Page } from '@playwright/test';
import { abc, resetData, setState, shot } from '../helpers/harness';
import { signIn } from '../helpers/sign-in';
import { submitSurveyByApi } from '../helpers/survey';

/**
 * The "before" picture for proposals, the last part not yet rebuilt. This describes the old
 * behaviour on purpose and goes once proposals are fixed.
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

test('a parent proposing to a mistyped shortcode gets a browser alert', async ({
  page
}, info) => {
  test.skip(info.project.name != 'desktop', 'Checked once, on desktop.');
  abc({ students: ['pa1224'] });
  await signIn(page, 'pa1224@ic.ac.uk');
  await submitSurveyByApi(page, 'Pat');

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
