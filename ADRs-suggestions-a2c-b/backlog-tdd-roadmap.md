# Backlog and TDD Roadmap

## Phase 0: Baseline stability

1. Keep build, tests, and `astro check` green.
2. Remove remaining starter-template assumptions.
3. Keep route behavior aligned with the URL contract.
4. Maintain GitHub Actions CI for pull requests into `main` and deploy from `main`.

## Phase 1: Editorial workflow

1. Improve post templates for the external vault.
2. Expand publication validations as new rules appear.
3. Add better author-facing feedback for publish failures.

## Phase 2: Portfolio coordination

1. Standardize how the portfolio stores article references.
2. Optionally add machine-readable metadata export.

## Phase 3: UX evolution

1. Improve article browsing and categorization.
2. Add search, series pages, or curated indexes only after the base workflow stays stable.
3. Implement user-selectable theme support (`light`/`dark`) with persistence and system-preference fallback.
4. Add tests for theme behavior first (initialization, toggle, persistence, and no-regression in both themes) before implementation changes.
