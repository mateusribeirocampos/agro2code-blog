import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_EDITORIAL_LANGUAGE,
  listPostsForLanguage,
  listStaticPathsForLanguage,
  normalizeCanonicalSlug,
} from '../src/utils/blog.js';

const posts = [
  {
    data: {
      title: 'Visible PT',
      draft: false,
      lang: 'pt',
      pubDate: new Date('2026-03-01'),
      canonicalSlug: 'visible-pt',
    },
  },
  {
    data: {
      title: 'Draft PT',
      draft: true,
      lang: 'pt',
      pubDate: new Date('2026-03-02'),
      canonicalSlug: 'draft-pt',
    },
  },
  {
    data: {
      title: 'Visible EN',
      draft: false,
      lang: 'en',
      pubDate: new Date('2026-03-03'),
      canonicalSlug: 'visible-en',
    },
  },
];

test('default editorial language is PT', () => {
  assert.equal(DEFAULT_EDITORIAL_LANGUAGE, 'pt');
});

test('normalizeCanonicalSlug converts text to kebab-case', () => {
  assert.equal(normalizeCanonicalSlug(' Teste de Integração Astro '), 'teste-de-integrao-astro');
});

test('listPostsForLanguage filters by language, removes drafts and sorts by date', () => {
  const result = listPostsForLanguage(posts, 'pt');

  assert.equal(result.length, 1);
  assert.equal(result[0].data.title, 'Visible PT');
  assert.equal(result[0].slug, 'visible-pt');
});

test('listStaticPathsForLanguage uses canonicalSlug in route params', () => {
  const result = listStaticPathsForLanguage(posts, 'en');

  assert.deepEqual(result, [
    {
      params: { slug: 'visible-en' },
      props: posts[2],
    },
  ]);
});

