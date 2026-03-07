# ADR 011: Portfolio Article Reference Contract

- Status: Proposed
- Date: 2026-03-07

## Context

Phase 2 requires a stable way for the portfolio to surface selected articles from `agro2code-blog` without coupling both repositories at runtime.

The current portfolio-side blog structure is too small for this integration. A minimal local card model such as:

- `title`
- `description`
- `date`
- `readTime`
- `slug`
- `image`

is not enough to preserve the public URL contract or support curated article references consistently.

The existing accepted decisions already establish two constraints:

- the portfolio integration must stay simple and URL-based
- `canonicalSlug` is a public contract and must remain stable after publication

## Decision

`agro2code-blog` will expose article references for portfolio consumption through a stable metadata contract.

The reference payload must include:

- `lang`
- `title`
- `description`
- `pubDate`
- `updatedDate` when available
- `canonicalSlug`
- `url`
- `portfolioFeatured`
- `portfolioSummary` when available
- `heroImage` when available

Reference shape:

```ts
type PortfolioArticleReference = {
  lang: 'en' | 'pt';
  title: string;
  description: string;
  pubDate: string;
  updatedDate?: string;
  canonicalSlug: string;
  url: string;
  portfolioFeatured: boolean;
  portfolioSummary?: string;
  heroImage?: string;
};
```

The public URL contract remains:

- EN list: `/agro2code-blog/blog/`
- EN article: `/agro2code-blog/blog/{slug}/`
- PT list: `/agro2code-blog/pt/blog/`
- PT article: `/agro2code-blog/pt/blog/{slug}/`

For article references, `url` must already be exported in final public form, so the portfolio does not rebuild article URLs from raw fields.

The portfolio should consume curated references, with `portfolioFeatured: true` as the default inclusion rule for article cards or highlighted lists.

No local machine path, repository checkout path, or environment-specific filesystem location is part of this contract.

## Consequences

- The portfolio stays decoupled from the blog runtime and only depends on stable exported metadata.
- `canonicalSlug` and language-aware URLs become explicit integration data, not implicit UI assumptions.
- The metadata export can be introduced later without changing the reference shape again.
- Existing portfolio-side hardcoded blog card structures should be migrated toward this contract.
- Any feed or public metadata surface in `agro2code-blog` must use the same language-aware URL rules.
