# ADR 005: TDD-First Quality Strategy

- Status: Accepted
- Date: 2026-03-04

## Context

The project needs to evolve safely while changing content workflow, routes, and schema.

## Decision

The project follows a TDD-first approach with automated checks:

- Node-based tests for utilities and publication workflow
- Contract tests for committed content files
- `astro check` as a static validation gate
- `npm run build` as a release gate

## Consequences

- Every relevant change should start from a failing test.
- Regressions in content contracts or publication logic are detected earlier.

