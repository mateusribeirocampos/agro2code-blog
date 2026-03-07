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
  runCli,
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
          tags: "'api'",
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
          tags: "'api'",
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
          tags: "'api'",
          canonicalSlug: "'post-valido'",
        },
        'pt',
      ),
    /pubDate must be a valid date/,
  );
});

test('validatePostFrontmatter rejects empty required editorial fields', () => {
  assert.throws(
    () =>
      validatePostFrontmatter(
        {
          title: "''",
          description: "'Desc'",
          author: "'Mateus Campos'",
          pubDate: "'Mar 04 2026'",
          draft: 'false',
          lang: "'pt'",
          category: "'workflow'",
          tags: "'api'",
          canonicalSlug: "'post-valido'",
        },
        'pt',
      ),
    /title must not be empty/,
  );
});

test('validatePostFrontmatter rejects placeholder canonicalSlug values from the template', () => {
  assert.throws(
    () =>
      validatePostFrontmatter(
        {
          title: "'Post valido'",
          description: "'Desc valida'",
          author: "'Mateus Campos'",
          pubDate: "'Mar 04 2026'",
          draft: 'false',
          lang: "'pt'",
          category: "'workflow'",
          tags: "'api'",
          canonicalSlug: "'titulo-do-post-em-kebab-case'",
        },
        'pt',
      ),
    /canonicalSlug must be replaced with a real slug before publishing/,
  );
});

test('publishPost rejects posts without at least one tag item', async () => {
  const sandbox = await mkdtemp(path.join(tmpdir(), 'a2c-tags-'));
  const vault = path.join(sandbox, 'astro2code-blog');
  const drafts = path.join(vault, 'Rascunhos');
  const published = path.join(vault, 'Publicados');
  const fileName = 'sem-tags.md';
  const fileContents = `---
title: 'Post sem tags'
description: 'Valida que tags nao podem ficar vazias'
author: 'Mateus Campos'
pubDate: 'Mar 04 2026'
draft: false
lang: 'pt'
category: 'workflow'
tags:
canonicalSlug: 'post-sem-tags'
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
    /tags must include at least one item/,
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
  assert.match(templateContents, /title: 'Titulo provisorio do post'/);
  assert.match(templateContents, /lang: 'pt'/);
  assert.match(templateContents, /pubDate: '\d{4}-\d{2}-\d{2}'/);
  assert.doesNotMatch(templateContents, /updatedDate:/);
  assert.match(templateContents, /category: 'agricultura-digital'/);
  assert.match(templateContents, /- 'api'/);
  assert.match(templateContents, /- 'dados'/);
  assert.match(templateContents, /series: ''/);
  assert.match(templateContents, /canonicalSlug: 'titulo-do-post-em-kebab-case'/);
  assert.match(templateContents, /portfolioFeatured: false/);
  assert.match(templateContents, /portfolioSummary: ''/);
  assert.match(templateContents, /heroImage: ''/);
  assert.match(templateContents, /Antes de publicar, revise title, description, category, tags e canonicalSlug\./);
  assert.match(templateContents, /## Contexto/);
  assert.match(templateContents, /## Problema ou oportunidade/);
  assert.match(templateContents, /## Solucao ou analise/);
  assert.match(templateContents, /## Proximos passos/);
  assert.match(templateContents, /## Referencias/);
  assert.doesNotMatch(templateContents, /tag-1/);
  assert.doesNotMatch(templateContents, /blog-placeholder-1/);
});

test('initializePostTemplate creates an EN template in the external vault', async () => {
  const sandbox = await mkdtemp(path.join(tmpdir(), 'a2c-template-'));
  const vault = path.join(sandbox, 'obsidian-vault');
  await mkdir(vault, { recursive: true });

  const result = await initializePostTemplate('en', { OBSIDIAN_VAULT_PATH: vault });
  const templateContents = await readFile(result.templatePath, 'utf8');

  assert.match(result.templatePath, /Templates\/Blog-Post-Template-en\.md$/);
  assert.match(templateContents, /title: 'Working post title'/);
  assert.match(templateContents, /lang: 'en'/);
  assert.match(templateContents, /pubDate: '\d{4}-\d{2}-\d{2}'/);
  assert.doesNotMatch(templateContents, /updatedDate:/);
  assert.match(templateContents, /category: 'digital-agriculture'/);
  assert.match(templateContents, /- 'api'/);
  assert.match(templateContents, /- 'integration'/);
  assert.match(templateContents, /series: ''/);
  assert.match(templateContents, /canonicalSlug: 'post-title-in-kebab-case'/);
  assert.match(templateContents, /portfolioFeatured: false/);
  assert.match(templateContents, /portfolioSummary: ''/);
  assert.match(templateContents, /heroImage: ''/);
  assert.match(templateContents, /Before publishing, review title, description, category, tags, and canonicalSlug\./);
  assert.match(templateContents, /## Context/);
  assert.match(templateContents, /## Problem or opportunity/);
  assert.match(templateContents, /## Solution or analysis/);
  assert.match(templateContents, /## Next steps/);
  assert.match(templateContents, /## References/);
  assert.doesNotMatch(templateContents, /tag-1/);
  assert.doesNotMatch(templateContents, /blog-placeholder-1/);
});

test('runCli initializes a PT template from the --init-template command', async () => {
  const sandbox = await mkdtemp(path.join(tmpdir(), 'a2c-template-cli-'));
  const vault = path.join(sandbox, 'obsidian-vault');
  const logs = [];
  const errors = [];

  await mkdir(vault, { recursive: true });

  const exitCode = await runCli(['--init-template', 'pt'], { OBSIDIAN_VAULT_PATH: vault }, {
    log: (message) => logs.push(message),
    error: (message) => errors.push(message),
  });

  const templatePath = path.join(vault, 'Templates', 'Blog-Post-Template-pt.md');
  const templateContents = await readFile(templatePath, 'utf8');

  assert.equal(exitCode, 0);
  assert.equal(errors.length, 0);
  assert.match(logs[0], /Initialized template at .*Blog-Post-Template-pt\.md/);
  assert.match(templateContents, /title: 'Titulo provisorio do post'/);
  assert.match(templateContents, /## Contexto/);
});

test('runCli publishes a post from positional arguments', async () => {
  const sandbox = await mkdtemp(path.join(tmpdir(), 'a2c-publish-cli-'));
  const vault = path.join(sandbox, 'obsidian-vault');
  const drafts = path.join(vault, 'Rascunhos');
  const published = path.join(vault, 'Publicados');
  const contentRoot = path.join(sandbox, 'content-root');
  const fileName = 'cli-post.md';
  const logs = [];
  const errors = [];
  const fileContents = `---
title: 'Publicacao por CLI'
description: 'Valida argumentos posicionais do CLI'
author: 'Mateus Campos'
pubDate: 'Mar 06 2026'
draft: false
lang: 'pt'
category: 'workflow'
tags:
  - 'cli'
canonicalSlug: 'publicacao-por-cli'
---

Conteudo de teste.
`;

  await mkdir(drafts, { recursive: true });
  await mkdir(published, { recursive: true });
  await writeFile(path.join(drafts, fileName), fileContents, 'utf8');

  const exitCode = await runCli(
    [fileName, 'pt'],
    { OBSIDIAN_VAULT_PATH: vault, A2C_CONTENT_ROOT: contentRoot },
    {
      log: (message) => logs.push(message),
      error: (message) => errors.push(message),
    },
  );

  assert.equal(exitCode, 0);
  assert.equal(errors.length, 0);
  assert.match(logs[0], /Published .*cli-post\.md/);
  assert.match(logs[1], /Archived source at .*cli-post\.md/);
  assert.match(logs[2], /Canonical URL segment: publicacao-por-cli/);
});

test('runCli reports author guidance for editorial validation failures', async () => {
  const sandbox = await mkdtemp(path.join(tmpdir(), 'a2c-cli-error-'));
  const vault = path.join(sandbox, 'obsidian-vault');
  const drafts = path.join(vault, 'Rascunhos');
  const published = path.join(vault, 'Publicados');
  const fileName = 'placeholder-post.md';
  const logs = [];
  const errors = [];
  const fileContents = `---
title: 'Titulo provisorio do post'
description: 'Resumo em 1 ou 2 frases sobre o que o leitor vai aprender.'
author: 'Mateus Campos'
pubDate: '2026-03-06'
draft: false
lang: 'pt'
category: 'agricultura-digital'
tags:
  - 'api'
canonicalSlug: 'titulo-do-post-em-kebab-case'
---

Conteudo de teste.
`;

  await mkdir(drafts, { recursive: true });
  await mkdir(published, { recursive: true });
  await writeFile(path.join(drafts, fileName), fileContents, 'utf8');

  const exitCode = await runCli(
    [fileName, 'pt'],
    { OBSIDIAN_VAULT_PATH: vault, A2C_CONTENT_ROOT: path.join(sandbox, 'content-root') },
    {
      log: (message) => logs.push(message),
      error: (message) => errors.push(message),
    },
  );

  assert.equal(exitCode, 1);
  assert.equal(logs.length, 0);
  assert.match(errors[0], /title must be replaced with a real editorial value before publishing/);
  assert.match(errors[1], /replace template placeholders and fill all editorial fields before publishing/i);
});

test('runCli reports configuration guidance when OBSIDIAN_VAULT_PATH is missing', async () => {
  const logs = [];
  const errors = [];

  const exitCode = await runCli(['post.md', 'pt'], { OBSIDIAN_VAULT_PATH: '' }, {
    log: (message) => logs.push(message),
    error: (message) => errors.push(message),
  });

  assert.equal(exitCode, 1);
  assert.equal(logs.length, 0);
  assert.match(errors[0], /OBSIDIAN_VAULT_PATH is required/);
  assert.match(errors[1], /configure OBSIDIAN_VAULT_PATH in your local .env or shell environment/i);
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
