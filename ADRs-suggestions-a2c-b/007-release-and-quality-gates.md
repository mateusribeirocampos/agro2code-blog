# ADR 007: Release and Quality Gates

- Status: Accepted
- Date: 2026-03-04

## Context

The blog must support reliable publishing without manual inspection of every change.

## Decision

No change is considered releasable unless the following are green:

- `npm run test`
- `npm run check`
- `npm run build`
- GitHub Actions CI on the target branch

Content-specific expectations:

- drafts do not appear in public listing pages
- route slugs come from `canonicalSlug`
- content files match the schema contract

## Consequences

- CI blocks lower-quality changes before deployment.
- Publishing errors move closer to commit time.
