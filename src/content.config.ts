import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const supportedLanguages = ['en', 'pt'] as const;

const blogColection = defineCollection({
	loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
	schema: z
		.object({
			title: z.string().min(1),
			description: z.string().min(1),
			author: z.string().min(1),
			pubDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			draft: z.boolean(),
			lang: z.enum(supportedLanguages),
			category: z.string().min(1),
			tags: z.array(z.string().min(1)).min(1),
			heroImage: z.string().optional(),
			series: z.string().optional(),
			canonicalSlug: z.string().regex(/^[a-z0-9-]+$/),
			portfolioFeatured: z.boolean().optional(),
			portfolioSummary: z.string().optional(),
		})
		.superRefine((data, ctx) => {
			if (data.portfolioFeatured && !data.portfolioSummary) {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: 'portfolioSummary is required when portfolioFeatured is true.',
					path: ['portfolioSummary'],
				});
			}
		}),
});

export const collections = { blog: blogColection };
