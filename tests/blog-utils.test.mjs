import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildPublicBlogListPath,
  buildPublicPostPath,
  buildLanguageSwitcherPathsByPostId,
  DEFAULT_EDITORIAL_LANGUAGE,
  listPostsForLanguage,
  listPortfolioArticleReferences,
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

test('buildPublicBlogListPath returns the public listing path for each language', () => {
  assert.equal(buildPublicBlogListPath('en'), '/agro2code-blog/blog/');
  assert.equal(buildPublicBlogListPath('pt'), '/agro2code-blog/pt/blog/');
});

test('buildPublicPostPath builds public article URLs from language and canonicalSlug', () => {
  assert.equal(buildPublicPostPath('en', 'visible-en'), '/agro2code-blog/blog/visible-en/');
  assert.equal(buildPublicPostPath('pt', 'visible-pt'), '/agro2code-blog/pt/blog/visible-pt/');
  assert.equal(buildPublicPostPath('en', '/visible-en/'), '/agro2code-blog/blog/visible-en/');
});

test('listPostsForLanguage filters by language, removes drafts and sorts by date', () => {
  const result = listPostsForLanguage(posts, 'pt');

  assert.equal(result.length, 1);
  assert.equal(result[0].data.title, 'Visible PT');
  assert.equal(result[0].slug, 'visible-pt');
  assert.equal(result[0].publicUrl, '/agro2code-blog/pt/blog/visible-pt/');
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
    en: '/agro2code-blog/blog/visible-en/',
    pt: '/agro2code-blog/pt/blog/visible-pt/',
  });

  assert.deepEqual(mapping.get('pt/first-post.md'), {
    en: '/agro2code-blog/blog/visible-en/',
    pt: '/agro2code-blog/pt/blog/visible-pt/',
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
    en: '/agro2code-blog/blog/only-en/',
    pt: '/agro2code-blog/pt/blog/',
  });
});

test('listPortfolioArticleReferences exports featured visible posts with absolute public URLs', () => {
  const portfolioPosts = [
    {
      id: 'pt/featured-post.md',
      data: {
        title: 'Featured PT',
        description: 'Resumo PT',
        draft: false,
        lang: 'pt',
        pubDate: new Date('2026-03-02T00:00:00.000Z'),
        updatedDate: new Date('2026-03-04T00:00:00.000Z'),
        canonicalSlug: 'featured-pt',
        portfolioFeatured: true,
        portfolioSummary: 'Resumo para portfolio',
        heroImage: '/agro2code-blog/agriculture-5.png',
      },
    },
    {
      id: 'en/not-featured.md',
      data: {
        title: 'Visible but not featured',
        description: 'Should stay out of the portfolio export',
        draft: false,
        lang: 'en',
        pubDate: new Date('2026-03-03T00:00:00.000Z'),
        canonicalSlug: 'visible-not-featured',
        portfolioFeatured: false,
      },
    },
    {
      id: 'en/draft-featured.md',
      data: {
        title: 'Draft featured',
        description: 'Should stay out because draft is true',
        draft: true,
        lang: 'en',
        pubDate: new Date('2026-03-05T00:00:00.000Z'),
        canonicalSlug: 'draft-featured',
        portfolioFeatured: true,
        portfolioSummary: 'Draft summary',
      },
    },
  ];

  const result = listPortfolioArticleReferences(portfolioPosts, 'https://mateusribeirocampos.github.io');

  assert.deepEqual(result, [
    {
      lang: 'pt',
      title: 'Featured PT',
      description: 'Resumo PT',
      pubDate: '2026-03-02T00:00:00.000Z',
      updatedDate: '2026-03-04T00:00:00.000Z',
      canonicalSlug: 'featured-pt',
      url: 'https://mateusribeirocampos.github.io/agro2code-blog/pt/blog/featured-pt/',
      portfolioFeatured: true,
      portfolioSummary: 'Resumo para portfolio',
      heroImage: 'https://mateusribeirocampos.github.io/agro2code-blog/agriculture-5.png',
    },
  ]);
});
