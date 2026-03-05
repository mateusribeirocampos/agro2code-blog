import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildLanguageSwitcherPathsByPostId,
  DEFAULT_EDITORIAL_LANGUAGE,
  listPostsForLanguage,
  listStaticPathsForLanguage,
  normalizeCanonicalSlug,
} from '../src/utils/blog.js';

const posts = [
  {
    id: 'pt/first-post.md',
    data: {
      title: 'Visible PT',
      draft: false,
      lang: 'pt',
      pubDate: new Date('2026-03-01'),
      canonicalSlug: 'visible-pt',
    },
  },
  {
    id: 'pt/draft-post.md',
    data: {
      title: 'Draft PT',
      draft: true,
      lang: 'pt',
      pubDate: new Date('2026-03-02'),
      canonicalSlug: 'draft-pt',
    },
  },
  {
    id: 'en/first-post.md',
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

test('buildLanguageSwitcherPathsByPostId links translated posts with different slugs', () => {
  const mapping = buildLanguageSwitcherPathsByPostId(posts);

  assert.deepEqual(mapping.get('en/first-post.md'), {
    en: '/blog/visible-en/',
    pt: '/pt/blog/visible-pt/',
  });

  assert.deepEqual(mapping.get('pt/first-post.md'), {
    en: '/blog/visible-en/',
    pt: '/pt/blog/visible-pt/',
  });
});

test('buildLanguageSwitcherPathsByPostId falls back to listing when translation is missing', () => {
  const enOnlyPosts = [
    {
      id: 'en/only-en.md',
      data: {
        title: 'Only EN',
        draft: false,
        lang: 'en',
        pubDate: new Date('2026-03-03'),
        canonicalSlug: 'only-en',
      },
    },
  ];

  const mapping = buildLanguageSwitcherPathsByPostId(enOnlyPosts);

  assert.deepEqual(mapping.get('en/only-en.md'), {
    en: '/blog/only-en/',
    pt: '/pt/blog/',
  });
});
