import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';

test('font preloads reference project font assets instead of hardcoded base path', async () => {
  const head = await readFile('src/components/BaseHead.astro', 'utf8');
  const globalStyles = await readFile('src/styles/global.css', 'utf8');

  assert.match(head, /href="\/fonts\/atkinson-regular\.woff"/);
  assert.match(head, /href="\/fonts\/atkinson-bold\.woff"/);
  assert.doesNotMatch(head, /\/agro2code-blog\/fonts\/atkinson-regular\.woff/);
  assert.doesNotMatch(head, /\/agro2code-blog\/fonts\/atkinson-bold\.woff/);
  assert.match(globalStyles, /url\('\/fonts\/atkinson-regular\.woff'\)/);
  assert.match(globalStyles, /url\('\/fonts\/atkinson-bold\.woff'\)/);
  assert.doesNotMatch(globalStyles, /\/agro2code-blog\/fonts\/atkinson-regular\.woff/);
  assert.doesNotMatch(globalStyles, /\/agro2code-blog\/fonts\/atkinson-bold\.woff/);
});

test('font files exist in public/fonts', async () => {
  await access('public/fonts/atkinson-regular.woff', constants.F_OK);
  await access('public/fonts/atkinson-bold.woff', constants.F_OK);
});
