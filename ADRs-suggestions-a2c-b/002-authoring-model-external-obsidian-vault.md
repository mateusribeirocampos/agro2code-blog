# ADR 002: External Obsidian Vault as the Authoring Source

- Status: Accepted
- Date: 2026-03-04

## Context

There is an existing external Obsidian vault used as the writing source. The repository should consume content from that vault without hardcoding machine-specific assumptions in application code.

## Decision

The external Obsidian vault is the official source of authoring.

- `OBSIDIAN_VAULT_PATH` defines the vault root.
- Draft inputs live in `Rascunhos/`.
- Archived sources move to `Publicados/`.
- The repository stores only published content in `src/content/blog`.

## Consequences

- The authoring workflow stays fast and editor-friendly.
- Local configuration is required before using the publication script.
- The old in-repo `obsidian-vault/` folder is no longer the primary source of truth.
