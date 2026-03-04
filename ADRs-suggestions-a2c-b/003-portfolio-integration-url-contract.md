# ADR 003: Portfolio Integration Through Stable URL Contracts

- Status: Accepted
- Date: 2026-03-04

## Context

The portfolio blog page acts as a discovery surface. Interested readers are redirected to `agro2code-blog` for the full content.

## Decision

The integration remains simple and URL-based.

- PT list: `/agro2code-blog/pt/blog/`
- PT article: `/agro2code-blog/pt/blog/{slug}/`
- EN list: `/agro2code-blog/blog/`
- EN article: `/agro2code-blog/blog/{slug}/`

The portfolio stores only summary metadata and the canonical URL for each article.

## Consequences

- The portfolio is decoupled from this repository runtime.
- `canonicalSlug` becomes a public contract and must remain stable after publication.

