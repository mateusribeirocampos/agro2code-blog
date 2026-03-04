# ADR 004: Hardened Content Model and Frontmatter Schema

- Status: Accepted
- Date: 2026-03-04

## Context

The starter template schema was too small for an editorial workflow that must support filtering, portfolio curation, and consistent publishing.

## Decision

Each post must include:

- `title`
- `description`
- `author`
- `pubDate`
- `draft`
- `lang`
- `category`
- `tags`
- `canonicalSlug`

Optional fields:

- `updatedDate`
- `heroImage`
- `series`
- `portfolioFeatured`
- `portfolioSummary`

Constraint:

- `portfolioSummary` is mandatory when `portfolioFeatured` is `true`.

## Consequences

- Content validation becomes stricter and more predictable.
- Existing posts must be kept aligned with the schema before release.

