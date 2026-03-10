import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('FormattedDate supports locale by language instead of hardcoded en-us', async () => {
  const component = await readFile('src/components/FormattedDate.astro', 'utf8');

  assert.match(component, /lang\?: 'en' \| 'pt'/);
  assert.match(component, /const locale = lang === 'pt' \? 'pt-BR' : 'en-US'/);
  assert.doesNotMatch(component, /toLocaleDateString\('en-us'/i);
});

test('BlogPost translates the updatedDate label and passes language to FormattedDate', async () => {
  const layout = await readFile('src/layouts/BlogPost.astro', 'utf8');
  const uiConfig = await readFile('src/i18n/ui.ts', 'utf8');

  assert.match(layout, /useTranslations/);
  assert.match(layout, /t\('blog\.updatedOn'\)/);
  assert.match(layout, /<FormattedDate date=\{pubDate\} lang=\{lang\} \/>/);
  assert.match(layout, /<FormattedDate date=\{updatedDate\} lang=\{lang\} \/>/);
  assert.match(uiConfig, /'blog\.updatedOn': 'Last updated on'/);
  assert.match(uiConfig, /'blog\.updatedOn': 'Atualizado em'/);
});

test('blog listing pages pass their language into FormattedDate', async () => {
  const blogEn = await readFile('src/pages/blog/index.astro', 'utf8');
  const blogPt = await readFile('src/pages/pt/blog/index.astro', 'utf8');

  assert.match(blogEn, /<FormattedDate date=\{post\.data\.pubDate\} lang=\{lang\} \/>/);
  assert.match(blogPt, /<FormattedDate date=\{post\.data\.pubDate\} lang=\{lang\} \/>/);
});
