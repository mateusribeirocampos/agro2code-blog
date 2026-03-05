import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  extractFrontmatter,
  initializePostTemplate,
  loadEnvFile,
  publishPost,
  resolveVaultPaths,
  validateLanguage,
  validatePostFrontmatter,
} from '../scripts/publish-post.mjs';

test('validateLanguage rejects unsupported values', () => {
  assert.throws(() => validateLanguage('es'), /Unsupported language/);
});

test('resolveVaultPaths requires OBSIDIAN_VAULT_PATH', async () => {
  await assert.rejects(() => resolveVaultPaths({}), /OBSIDIAN_VAULT_PATH is required/);
});

test('loadEnvFile reads key-value pairs from a local .env file', async () => {
  const sandbox = await mkdtemp(path.join(tmpdir(), 'a2c-env-'));
  const envFile = path.join(sandbox, '.env');

  await writeFile(envFile, "OBSIDIAN_VAULT_PATH=/tmp/obsidian-vault\nA2C_CONTENT_ROOT=/tmp/content-root\n", 'utf8');

  const loaded = await loadEnvFile(envFile);

  assert.equal(loaded.OBSIDIAN_VAULT_PATH, '/tmp/obsidian-vault');
  assert.equal(loaded.A2C_CONTENT_ROOT, '/tmp/content-root');
});

test('validatePostFrontmatter requires the full contract', () => {
  assert.throws(
    () =>
      validatePostFrontmatter(
        {
          title: "'Post'",
          description: "'Desc'",
        },
        'pt',
      ),
    /Missing required frontmatter field: author/,
  );
});

test('validatePostFrontmatter requires portfolioSummary when portfolioFeatured is true', () => {
  assert.throws(
    () =>
      validatePostFrontmatter(
        {
          title: "'Post'",
          description: "'Desc'",
          author: "'Mateus Campos'",
          pubDate: "'Mar 04 2026'",
          draft: 'false',
          lang: "'pt'",
          category: "'workflow'",
          tags: '',
          canonicalSlug: "'post-valido'",
          portfolioFeatured: 'true',
        },
        'pt',
      ),
    /portfolioSummary is required when portfolioFeatured is true/,
  );
});

test('validatePostFrontmatter enforces draft as boolean literal', () => {
  assert.throws(
    () =>
      validatePostFrontmatter(
        {
          title: "'Post'",
          description: "'Desc'",
          author: "'Mateus Campos'",
          pubDate: "'Mar 04 2026'",
          draft: "'no'",
          lang: "'pt'",
          category: "'workflow'",
          tags: '',
          canonicalSlug: "'post-valido'",
        },
        'pt',
      ),
    /draft must be true or false/,
  );
});

test('validatePostFrontmatter enforces parseable pubDate', () => {
  assert.throws(
    () =>
      validatePostFrontmatter(
        {
          title: "'Post'",
          description: "'Desc'",
          author: "'Mateus Campos'",
          pubDate: "'not-a-date'",
          draft: 'false',
          lang: "'pt'",
          category: "'workflow'",
          tags: '',
          canonicalSlug: "'post-valido'",
        },
        'pt',
      ),
    /pubDate must be a valid date/,
  );
});

test('publishPost imports a valid file from the configured external vault', async () => {
  const sandbox = await mkdtemp(path.join(tmpdir(), 'a2c-blog-'));
  const vault = path.join(sandbox, 'astro2code-blog');
  const drafts = path.join(vault, 'Rascunhos');
  const published = path.join(vault, 'Publicados');
  const contentDir = path.join(sandbox, 'content-root', 'pt');
  const fileName = 'test-publish.md';
  const fileContents = `---
title: 'Publicacao de teste'
description: 'Valida o fluxo de importacao'
author: 'Mateus Campos'
pubDate: 'Mar 04 2026'
draft: false
lang: 'pt'
category: 'workflow'
tags:
  - 'teste'
canonicalSlug: 'publicacao-de-teste'
---

Conteudo de teste.
`;

  await mkdir(drafts, { recursive: true });
  await mkdir(published, { recursive: true });
  await writeFile(path.join(drafts, fileName), fileContents, 'utf8');

  const result = await publishPost(fileName, 'pt', {
    OBSIDIAN_VAULT_PATH: vault,
    A2C_CONTENT_ROOT: path.join(sandbox, 'content-root'),
  });

  assert.equal(result.slug, 'publicacao-de-teste');
  assert.equal(result.language, 'pt');

  const imported = await readFile(path.join(contentDir, fileName), 'utf8');
  const archived = await readFile(path.join(published, fileName), 'utf8');
  const frontmatter = extractFrontmatter(imported);

  assert.equal(imported, archived);
  assert.equal(frontmatter.canonicalSlug, "'publicacao-de-teste'");
});

test('publishPost rejects unsupported file extensions with author-facing guidance', async () => {
  const sandbox = await mkdtemp(path.join(tmpdir(), 'a2c-blog-'));
  const vault = path.join(sandbox, 'astro2code-blog');
  const drafts = path.join(vault, 'Rascunhos');
  const published = path.join(vault, 'Publicados');
  const fileName = 'test-publish.txt';
  const fileContents = `---
title: 'Publicacao de teste'
description: 'Valida o fluxo de importacao'
author: 'Mateus Campos'
pubDate: 'Mar 04 2026'
draft: false
lang: 'pt'
category: 'workflow'
tags:
  - 'teste'
canonicalSlug: 'publicacao-de-teste'
---

Conteudo de teste.
`;

  await mkdir(drafts, { recursive: true });
  await mkdir(published, { recursive: true });
  await writeFile(path.join(drafts, fileName), fileContents, 'utf8');

  await assert.rejects(
    () =>
      publishPost(fileName, 'pt', {
        OBSIDIAN_VAULT_PATH: vault,
        A2C_CONTENT_ROOT: path.join(sandbox, 'content-root'),
      }),
    /Only \.md or \.mdx files are supported/,
  );
});

test('publishPost reports clear message when draft file is missing', async () => {
  const sandbox = await mkdtemp(path.join(tmpdir(), 'a2c-blog-'));
  const vault = path.join(sandbox, 'astro2code-blog');
  const drafts = path.join(vault, 'Rascunhos');
  const published = path.join(vault, 'Publicados');
  await mkdir(drafts, { recursive: true });
  await mkdir(published, { recursive: true });

  await assert.rejects(
    () =>
      publishPost('arquivo-inexistente.md', 'pt', {
        OBSIDIAN_VAULT_PATH: vault,
        A2C_CONTENT_ROOT: path.join(sandbox, 'content-root'),
      }),
    /Draft file not found in Rascunhos/,
  );
});

test('initializePostTemplate creates a PT template in the external vault', async () => {
  const sandbox = await mkdtemp(path.join(tmpdir(), 'a2c-template-'));
  const vault = path.join(sandbox, 'obsidian-vault');
  await mkdir(vault, { recursive: true });

  const result = await initializePostTemplate('pt', { OBSIDIAN_VAULT_PATH: vault });
  const templateContents = await readFile(result.templatePath, 'utf8');

  assert.match(result.templatePath, /Templates\/Blog-Post-Template-pt\.md$/);
  assert.match(templateContents, /title: 'Titulo do post'/);
  assert.match(templateContents, /lang: 'pt'/);
  assert.match(templateContents, /updatedDate: ''/);
  assert.match(templateContents, /series: ''/);
  assert.match(templateContents, /canonicalSlug: 'titulo-do-post-em-kebab-case'/);
  assert.match(templateContents, /portfolioFeatured: false/);
  assert.match(templateContents, /## Resumo/);
});

test('initializePostTemplate creates an EN template in the external vault', async () => {
  const sandbox = await mkdtemp(path.join(tmpdir(), 'a2c-template-'));
  const vault = path.join(sandbox, 'obsidian-vault');
  await mkdir(vault, { recursive: true });

  const result = await initializePostTemplate('en', { OBSIDIAN_VAULT_PATH: vault });
  const templateContents = await readFile(result.templatePath, 'utf8');

  assert.match(result.templatePath, /Templates\/Blog-Post-Template-en\.md$/);
  assert.match(templateContents, /title: 'Post title'/);
  assert.match(templateContents, /lang: 'en'/);
  assert.match(templateContents, /updatedDate: ''/);
  assert.match(templateContents, /series: ''/);
  assert.match(templateContents, /canonicalSlug: 'post-title-in-kebab-case'/);
  assert.match(templateContents, /portfolioFeatured: false/);
  assert.match(templateContents, /## Summary/);
});

test('publishPost rejects draft posts', async () => {
  const sandbox = await mkdtemp(path.join(tmpdir(), 'a2c-draft-'));
  const vault = path.join(sandbox, 'astro2code-blog');
  const drafts = path.join(vault, 'Rascunhos');
  const published = path.join(vault, 'Publicados');
  const fileName = 'draft-post.md';
  const fileContents = `---
title: 'Rascunho'
description: 'Nao deve publicar'
author: 'Mateus Campos'
pubDate: 'Mar 04 2026'
draft: true
lang: 'pt'
category: 'workflow'
tags:
  - 'rascunho'
canonicalSlug: 'rascunho'
---

Conteudo de teste.
`;

  await mkdir(drafts, { recursive: true });
  await mkdir(published, { recursive: true });
  await writeFile(path.join(drafts, fileName), fileContents, 'utf8');

  await assert.rejects(
    () =>
      publishPost(fileName, 'pt', {
        OBSIDIAN_VAULT_PATH: vault,
        A2C_CONTENT_ROOT: path.join(sandbox, 'content-root'),
      }),
    /Draft posts cannot be published/,
  );
});
