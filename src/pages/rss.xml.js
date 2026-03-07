import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';
import { buildPublicPostPath, isVisiblePost } from '../utils/blog';

export async function GET(context) {
	const posts = await getCollection('blog');
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.filter(isVisiblePost).map((post) => ({
			...post.data,
			link: buildPublicPostPath(post.data.lang, post.data.canonicalSlug),
		})),
	});
}
