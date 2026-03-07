import { getCollection } from 'astro:content';
import { listPortfolioArticleReferences } from '../utils/blog';

export async function GET({ site }) {
  const posts = await getCollection('blog');
  const payload = listPortfolioArticleReferences(posts, site);

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
