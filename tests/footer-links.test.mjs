import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('footer does not include starter-template social links', async () => {
  const footer = await readFile('src/components/Footer.astro', 'utf8');

  assert.doesNotMatch(footer, /withastro/i);
  assert.doesNotMatch(footer, /astrodotbuild/i);
  assert.doesNotMatch(footer, /m\.webtoo\.ls/i);
});

