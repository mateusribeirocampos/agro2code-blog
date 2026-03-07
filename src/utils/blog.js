export const SUPPORTED_LANGUAGES = ['en', 'pt'];
export const DEFAULT_EDITORIAL_LANGUAGE = 'pt';
const SITE_BASE_PATH = '/agro2code-blog';

export function normalizeCanonicalSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function isValidLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value);
}

export function isVisiblePost(post) {
  return !post.data.draft;
}

export function isPostInLanguage(post, language) {
  return post.data.lang === language;
}

export function buildPublicBlogListPath(language) {
  return language === 'pt' ? `${SITE_BASE_PATH}/pt/blog/` : `${SITE_BASE_PATH}/blog/`;
}

export function buildPublicPostPath(language, canonicalSlug) {
  const normalizedSlug = canonicalSlug.replace(/^\/+|\/+$/g, '');
  return language === 'pt'
    ? `${SITE_BASE_PATH}/pt/blog/${normalizedSlug}/`
    : `${SITE_BASE_PATH}/blog/${normalizedSlug}/`;
}

export function buildAbsolutePublicUrl(site, pathname) {
  return new URL(pathname, site).toString();
}

export function sortPostsByDateDesc(posts) {
  return [...posts].sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function toRouteSlug(post) {
  return post.data.canonicalSlug;
}

export function listPostsForLanguage(posts, language) {
  return sortPostsByDateDesc(posts)
    .filter((post) => isPostInLanguage(post, language))
    .filter(isVisiblePost)
    .map((post) => ({
      ...post,
      slug: toRouteSlug(post),
      publicUrl: buildPublicPostPath(post.data.lang, toRouteSlug(post)),
    }));
}

export function listStaticPathsForLanguage(posts, language) {
  return posts
    .filter((post) => isPostInLanguage(post, language))
    .filter(isVisiblePost)
    .map((post) => ({
      params: { slug: toRouteSlug(post) },
      props: post,
    }));
}

function getTranslationKey(post) {
  if (!post?.id) return toRouteSlug(post);
  const segments = post.id.split('/');
  return segments.length > 1 ? segments.slice(1).join('/') : post.id;
}

export function buildLanguageSwitcherPathsByPostId(posts) {
  const visiblePosts = posts.filter(isVisiblePost);
  const slugsByTranslationKey = new Map();

  for (const post of visiblePosts) {
    const key = getTranslationKey(post);
    const current = slugsByTranslationKey.get(key) || {};
    current[post.data.lang] = toRouteSlug(post);
    slugsByTranslationKey.set(key, current);
  }

  const pathsByPostId = new Map();

  for (const post of visiblePosts) {
    const key = getTranslationKey(post);
    const translatedSlugs = slugsByTranslationKey.get(key) || {};

    pathsByPostId.set(post.id, {
      en: translatedSlugs.en ? buildPublicPostPath('en', translatedSlugs.en) : buildPublicBlogListPath('en'),
      pt: translatedSlugs.pt ? buildPublicPostPath('pt', translatedSlugs.pt) : buildPublicBlogListPath('pt'),
    });
  }

  return pathsByPostId;
}

export function listPortfolioArticleReferences(posts, site) {
  return sortPostsByDateDesc(posts)
    .filter(isVisiblePost)
    .filter((post) => post.data.portfolioFeatured)
    .map((post) => {
      const reference = {
        lang: post.data.lang,
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate.toISOString(),
        canonicalSlug: post.data.canonicalSlug,
        url: buildAbsolutePublicUrl(site, buildPublicPostPath(post.data.lang, post.data.canonicalSlug)),
        portfolioFeatured: Boolean(post.data.portfolioFeatured),
      };

      if (post.data.updatedDate) {
        reference.updatedDate = post.data.updatedDate.toISOString();
      }

      if (post.data.portfolioSummary) {
        reference.portfolioSummary = post.data.portfolioSummary;
      }

      if (post.data.heroImage) {
        reference.heroImage = buildAbsolutePublicUrl(site, post.data.heroImage);
      }

      return reference;
    });
}
