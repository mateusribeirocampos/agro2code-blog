# ADR 009: GitHub Actions CI/CD and Pragmatic GitFlow

- Status: Accepted
- Date: 2026-03-04

## Context

The project needs a predictable release path in GitHub, not only a deploy workflow. Validation and deployment should be separated so pull requests are gated before `main`.

## Decision

Use a pragmatic GitFlow model:

- `feature/*` branches branch from `develop`
- `develop` is the integration branch
- `main` is the release branch
- pull requests into `develop` and `main` run CI
- pushes to `develop` also run CI
- pushes to `main` deploy to GitHub Pages

GitHub Actions split:

- `ci.yml` validates tests, checks, and build
- `deploy.yml` deploys only from `main`

## Consequences

- CI failures are caught before release promotion.
- Deployment stays tied to the stable branch only.
- The repository should create and maintain a `develop` branch to use this flow fully.

