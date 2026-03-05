import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  extractFrontmatter,
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

test('publishPost rejects files with unsupported extensions', async () => {
  const sandbox = await mkdtemp(path.join(tmpdir(), 'a2c-invalid-ext-'));
  const vault = path.join(sandbox, 'astro2code-blog');
  const drafts = path.join(vault, 'Rascunhos');
  const published = path.join(vault, 'Publicados');
  const fileName = 'test-publish.txt';

  await mkdir(drafts, { recursive: true });
  await mkdir(published, { recursive: true });
  await writeFile(path.join(drafts, fileName), 'plain text', 'utf8');

  await assert.rejects(
    () =>
      publishPost(fileName, 'pt', {
        OBSIDIAN_VAULT_PATH: vault,
        A2C_CONTENT_ROOT: path.join(sandbox, 'content-root'),
      }),
    /Only \.md and \.mdx files are supported/,
  );
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
