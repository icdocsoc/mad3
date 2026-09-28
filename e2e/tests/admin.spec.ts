import { expect, test } from '@playwright/test';
import {
  abc,
  resetData,
  seedStudent,
  setState,
  shot,
  sql
} from '../helpers/harness';
import { signIn } from '../helpers/sign-in';
import { answersFor } from '../helpers/survey';

test.beforeEach(() => {
  resetData();
  setState('open');
  abc({ students: ['pa1224', 'pb1224', 'pc1224', 'jg2423'] });
});

test('the export has every submitted answer and every pair, and nothing else', async ({
  browser,
  page
}, info) => {
  test.skip(info.project.name != 'desktop', 'Checked once, on desktop.');
  const as = async (shortcode: string) => {
    const one = await (await browser.newContext()).newPage();
    await signIn(one, `${shortcode}@ic.ac.uk`);
    return one;
  };
  const pat = await as('pa1224');
  const bea = await as('pb1224');
  const cai = await as('pc1224');
  for (const [one, name] of [
    [pat, 'Pat'],
    [bea, 'Bea'],
    [cai, 'Cai']
  ] as const)
    expect(
      (
        await one.request.post('/api/family/survey', {
          data: { answers: answersFor(name) }
        })
      ).ok()
    ).toBe(true);
  await pat.request.post('/api/family/propose', {
    data: { shortcode: 'pb1224' }
  });
  await bea.request.post('/api/family/acceptProposal', {
    data: { shortcode: 'pa1224' }
  });

  // A fresher part-way through: a draft, which the export must leave out.
  seedStudent('fr1226', 'fresher');
  const fran = await as('fr1226');
  await fran.request.post('/api/family/draft', {
    data: { answers: { name: 'Fran' } }
  });

  await signIn(page, 'jg2423@ic.ac.uk');
  const response = await page.request.get('/api/admin/export');
  expect(response.headers()['content-disposition']).toContain(
    'attachment; filename="mads-export-'
  );
  const exported = await response.json();
  expect(exported.pairs).toEqual([
    { id: expect.any(Number), parents: ['pb1224', 'pa1224'] }
  ]);
  const byCode = Object.fromEntries(
    exported.students.map((one: { shortcode: string }) => [one.shortcode, one])
  );
  expect(byCode.pa1224.answers).toMatchObject({
    name: 'Pat',
    shortcode: 'pa1224'
  });
  expect(byCode.pa1224.surveyVersion).toBe(exported.surveyVersion);
  expect(byCode.fr1226).toMatchObject({
    completedSurvey: false,
    answers: null
  });
  expect(JSON.stringify(exported)).not.toContain('Fran');

  // Only the committee can export.
  expect((await pat.request.get('/api/admin/export')).status()).toBe(403);

  // Who to chase: Cai has no partner, Fran never submitted.
  await page.goto('/admin');
  await expect(page.getByText('Parents without a partner (1)')).toBeVisible();
  await expect(page.getByText('Cai (pc1224)')).toBeVisible();
  await expect(page.getByText('fr1226 (fresher)')).toBeVisible();
  await page.screenshot({ path: shot('after-21-admin-chase'), fullPage: true });
  expect(sql('select count(*) from marriage')).toEqual(['1']);
});
