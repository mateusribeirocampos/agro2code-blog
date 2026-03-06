# ADR 006: Extreme Programming Delivery Cadence

- Status: Accepted
- Date: 2026-03-04

## Context

The project benefits from disciplined iteration because it is still moving from template state to a real editorial product.

## Decision

The implementation method is pragmatic XP:

- small stories
- TDD
- simple design
- frequent refactoring
- continuous integration
- small releases
- branch promotion through GitHub pull requests

## Consequences

- Changes should stay small enough to validate quickly.
- CI becomes the main gate for confidence and release readiness before merging `feature/*` work into `main`.
