import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  extractFrontmatter,
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
