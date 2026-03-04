import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('about pages do not contain lorem ipsum placeholder text', async () => {
  const aboutEn = await readFile('src/pages/about.astro', 'utf8');
  const aboutPt = await readFile('src/pages/pt/about.astro', 'utf8');

  assert.doesNotMatch(aboutEn, /lorem ipsum/i);
  assert.doesNotMatch(aboutPt, /lorem ipsum/i);
});

test('about pages have basic language coherence for EN and PT', async () => {
  const aboutEn = await readFile('src/pages/about.astro', 'utf8');
  const aboutPt = await readFile('src/pages/pt/about.astro', 'utf8');

  assert.match(aboutEn, /About Agro2Code Blog/i);
  assert.match(aboutEn, /portfolio/i);
  assert.match(aboutPt, /Sobre o Agro2Code Blog/i);
  assert.match(aboutPt, /portfólio/i);
});

