import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('BaseHead initializes theme from localStorage with system fallback', async () => {
  const baseHead = await readFile('src/components/BaseHead.astro', 'utf8');

  assert.match(baseHead, /localStorage\.getItem\('a2c-theme'\)/);
  assert.match(baseHead, /window\.matchMedia\('\(prefers-color-scheme: dark\)'\)\.matches/);
  assert.match(baseHead, /document\.documentElement\.dataset\.theme/);
});

test('Header renders a theme toggle control with persistence script', async () => {
  const header = await readFile('src/components/Header.astro', 'utf8');

  assert.match(header, /data-theme-toggle/);
  assert.match(header, /localStorage\.setItem\('a2c-theme'/);
  assert.match(header, /document\.documentElement\.dataset\.theme/);
});

test('Global styles define dark theme variables', async () => {
  const globalStyles = await readFile('src/styles/global.css', 'utf8');

  assert.match(globalStyles, /\[data-theme='dark'\]/);
  assert.match(globalStyles, /--gray-gradient:/);
  assert.match(globalStyles, /--black:/);
});
