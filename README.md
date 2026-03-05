# Agro2Code Blog

`agro2code-blog` is the editorial extension of the Agro2Code portfolio. The portfolio surfaces featured topics and directs readers here for the full article, discussion, or technical note.

Production URL: https://mateusribeirocampos.github.io/agro2code-blog/

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
4. Optionally create the post templates in the external vault:
   - `./scripts/publish-post.sh --init-template pt`
   - `./scripts/publish-post.sh --init-template en`
5. Open the generated template in `Templates/`, duplicate it, and save the new note in `Rascunhos/`.
6. Edit the frontmatter and the body content in Obsidian.
7. Publish the note with:
   - `./scripts/publish-post.sh <arquivo.md> [pt|en]`

The script automatically reads `.env` when available, validates the frontmatter contract, blocks duplicate `canonicalSlug` values in the same language, rejects files that are not `.md` or `.mdx`, rejects posts still marked with `draft: true`, imports the file into `src/content/blog/{lang}`, and archives the source note into `Publicados/`.

To initialize an Obsidian-ready post template in the external vault:

- `./scripts/publish-post.sh --init-template pt`
- `./scripts/publish-post.sh --init-template en`

This creates `Templates/Blog-Post-Template-{lang}.md` inside the configured external vault.

### Step-by-step example

1. Initialize the PT template:
   - `./scripts/publish-post.sh --init-template pt`
2. In Obsidian, copy `Templates/Blog-Post-Template-pt.md`.
3. Save the new note as `Rascunhos/meu-post.md`.
4. Update at least these fields before publishing:
   - `title`
   - `description`
   - `pubDate`
   - `category`
   - `tags`
   - `canonicalSlug`
5. Publish the note:
   - `./scripts/publish-post.sh meu-post.md pt`
6. Validate locally:
   - `npm run dev`
   - or `npm run build`
7. Commit from the feature branch and open a pull request into `main`.

### What happens during publication

- The source file is read from `Rascunhos/`
- The frontmatter is validated against the project contract
- The language is validated
- The `canonicalSlug` is checked for duplicates in the same language
- The file is copied into `src/content/blog/{lang}/`
- The original note is moved to `Publicados/`
- The post becomes part of the generated Astro site

## Quality gates

- `npm run test`
- `npm run check`
- `npm run build`
- `npm run ci`

These commands are designed to keep the project aligned with a TDD-first workflow.

## GitHub CI/CD and branch flow

The repository follows a mainline flow:

- `feature/*` branches for isolated work
- pull requests go directly into `main`
- `main` is the release branch

GitHub Actions:

- `.github/workflows/ci.yml` validates pull requests and protects release quality
- `.github/workflows/deploy.yml` deploys GitHub Pages only from `main`

## Project documentation

Architecture decisions and implementation guidance are documented in `ADRs-suggestions-a2c-b/`.
