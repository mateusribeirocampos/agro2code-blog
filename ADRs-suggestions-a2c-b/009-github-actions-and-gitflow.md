# ADR 009: GitHub Actions CI/CD and Mainline Branch Flow

- Status: Accepted
- Date: 2026-03-05

## Context

The project needs a predictable release path in GitHub with low operational overhead. Validation and deployment should stay separated while keeping the delivery flow simple and direct.

## Decision

Use a mainline model:

- `feature/*` branches for isolated work
- pull requests go directly into `main`
- `main` is the release branch
- `develop` is not part of the active delivery flow for now
- pull requests into `main` run CI
- pushes to `main` deploy to GitHub Pages

GitHub Actions split:

- `ci.yml` validates tests, checks, and build
- `deploy.yml` deploys only from `main`

## Consequences

- CI failures are caught before merge into the release branch.
- Deployment stays tied to the stable branch only.
- The workflow removes branch promotion overhead and shortens lead time to production.
- Any documentation or automation that still references `develop` must be treated as outdated until intentionally reintroduced.
