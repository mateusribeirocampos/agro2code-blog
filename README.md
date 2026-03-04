# Agro2Code Blog

`agro2code-blog` is the editorial extension of the Agro2Code portfolio. The portfolio surfaces featured topics and directs readers here for the full article, discussion, or technical note.

## Current architecture

- Static site built with Astro
- Content stored in `src/content/blog`
- Priority editorial language: `pt`
- Secondary language support: `en`
- Deployment target: GitHub Pages
- Authoring flow: external Obsidian vault configured through `OBSIDIAN_VAULT_PATH`

## Content contract

Every post in `src/content/blog/{lang}` must include:

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

If `portfolioFeatured` is `true`, `portfolioSummary` is required.

## Obsidian publishing flow

The repository assumes a local external Obsidian vault.

1. Configure `.env` from `.env.example`.
2. Set `OBSIDIAN_VAULT_PATH` to your local vault path, for example `/path/to/obsidian-vault`.
3. Create `Rascunhos/` and `Publicados/` inside the vault.
4. Place a valid Markdown or MDX file inside `Rascunhos/`.
5. Run `./scripts/publish-post.sh <arquivo.md> [pt|en]`.

The script automatically reads `.env` when available, validates the frontmatter contract, blocks duplicate `canonicalSlug` values in the same language, rejects files that are not `.md` or `.mdx`, rejects posts still marked with `draft: true`, imports the file into `src/content/blog/{lang}`, and archives the source note into `Publicados/`.

## Quality gates

- `npm run test`
- `npm run check`
- `npm run build`
- `npm run ci`

These commands are designed to keep the project aligned with a TDD-first workflow.

## GitHub CI/CD and branch flow

The repository is structured for a pragmatic GitFlow:

- `feature/*` branches for isolated work
- `develop` as the integration branch
- `main` as the release branch

GitHub Actions:

- `.github/workflows/ci.yml` validates pull requests into `develop` and `main`, plus direct pushes to `develop`
- `.github/workflows/deploy.yml` deploys GitHub Pages only from `main`

To use this flow fully, the remote repository should keep a `develop` branch in addition to `main`.

## Project documentation

Architecture decisions and implementation guidance are documented in `ADRs-suggestions-a2c-b/`.
