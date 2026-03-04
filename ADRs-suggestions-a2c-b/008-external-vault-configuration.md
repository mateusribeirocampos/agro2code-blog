# ADR 008: External Vault Configuration Through Environment Variables

- Status: Accepted
- Date: 2026-03-04

## Context

The existing Obsidian vault path is machine-specific, so it must not be hardcoded as a permanent repository assumption.

## Decision

The publication workflow reads:

- `OBSIDIAN_VAULT_PATH` for the external vault root
- optional `A2C_CONTENT_ROOT` for alternate publish targets in automation or tests

Defaults:

- `OBSIDIAN_VAULT_PATH` is required
- `A2C_CONTENT_ROOT` defaults to `src/content/blog`

## Consequences

- Local setup stays explicit.
- Tests can isolate publication side effects.

