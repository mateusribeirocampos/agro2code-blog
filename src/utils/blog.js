export const SUPPORTED_LANGUAGES = ['en', 'pt'];
export const DEFAULT_EDITORIAL_LANGUAGE = 'pt';

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
    .map((post) => ({ ...post, slug: toRouteSlug(post) }));
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

