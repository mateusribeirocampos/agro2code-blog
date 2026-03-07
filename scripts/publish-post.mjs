import { copyFile, mkdir, readFile, rename, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const REQUIRED_FRONTMATTER_FIELDS = [
  'title',
  'description',
  'author',
  'pubDate',
  'draft',
  'lang',
  'category',
  'tags',
  'canonicalSlug',
];

const SUPPORTED_LANGUAGES = ['en', 'pt'];
const REQUIRED_NON_EMPTY_FIELDS = ['title', 'description', 'author', 'category', 'canonicalSlug'];
const TEMPLATE_PLACEHOLDERS = {
  title: ['titulo provisorio do post', 'working post title'],
  description: [
    'resumo em 1 ou 2 frases sobre o que o leitor vai aprender.',
    'summarize in 1 or 2 sentences what the reader will learn.',
  ],
  canonicalSlug: ['titulo-do-post-em-kebab-case', 'post-title-in-kebab-case'],
};
const CLI_ERROR_TIPS = {
  config: 'Tip: configure OBSIDIAN_VAULT_PATH in your local .env or shell environment before publishing.',
  file: 'Tip: verify the draft file exists inside Rascunhos/ and use the full file name with extension.',
  extension: 'Tip: use a .md or .mdx file stored in Rascunhos/ before running the publish command.',
  usage: 'Tip: use --init-template <pt|en> to create a template or <arquivo.md> [pt|en] to publish a draft.',
  language: 'Tip: use pt or en in the command and keep frontmatter lang aligned with the selected language.',
  draft: 'Tip: keep the post in Rascunhos/ while editing and change draft: false only when it is ready to publish.',
  duplicate: 'Tip: choose a new canonicalSlug that is unique for the target language before publishing.',
  editorial: 'Tip: replace template placeholders and fill all editorial fields before publishing.',
  generic: 'Tip: verify language, frontmatter contract, file extension, and draft location in Rascunhos/.',
};

function createPublishError(code, message) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function getCliTipForError(error) {
  switch (error?.code) {
    case 'CONFIG':
      return CLI_ERROR_TIPS.config;
    case 'FILE':
      return CLI_ERROR_TIPS.file;
    case 'EXTENSION':
      return CLI_ERROR_TIPS.extension;
    case 'USAGE':
      return CLI_ERROR_TIPS.usage;
    case 'LANGUAGE':
      return CLI_ERROR_TIPS.language;
    case 'DRAFT':
      return CLI_ERROR_TIPS.draft;
    case 'DUPLICATE':
      return CLI_ERROR_TIPS.duplicate;
    case 'EDITORIAL':
      return CLI_ERROR_TIPS.editorial;
    default:
      return CLI_ERROR_TIPS.generic;
  }
}

function extractFrontmatterBlock(rawContent) {
  const match = rawContent.match(/^---\n([\s\S]*?)\n---/);

  if (!match) {
    throw createPublishError('EDITORIAL', 'Missing YAML frontmatter.');
  }

  return match[1];
}

export async function loadEnvFile(envFilePath = '.env') {
  try {
    const rawContents = await readFile(envFilePath, 'utf8');
    const values = {};

    for (const line of rawContents.split('\n')) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex === -1) {
        continue;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      const value = trimmed.slice(separatorIndex + 1).trim();
      values[key] = value;
    }

    return values;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return {};
    }

    throw error;
  }
}

export async function resolveRuntimeEnv(env = process.env, envFilePath = '.env') {
  const fileEnv = await loadEnvFile(envFilePath);

  return {
    ...fileEnv,
    ...env,
  };
}

export function extractFrontmatter(rawContent) {
  const frontmatterBlock = extractFrontmatterBlock(rawContent);
  const entries = {};

  for (const line of frontmatterBlock.split('\n')) {
    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    entries[key] = value;
  }

  return entries;
}

export function normalizeFrontmatterValue(value) {
  return value.replace(/^['"]|['"]$/g, '').trim();
}

function parseBooleanLiteral(value) {
  const normalized = normalizeFrontmatterValue(value).toLowerCase();
  if (normalized !== 'true' && normalized !== 'false') {
    throw createPublishError('EDITORIAL', 'draft must be true or false.');
  }

  return normalized === 'true';
}

export function validateLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw createPublishError('LANGUAGE', `Unsupported language "${language}". Use one of: ${SUPPORTED_LANGUAGES.join(', ')}.`);
  }

  return language;
}

export async function resolveVaultPaths(env = process.env) {
  const vaultPath = env.OBSIDIAN_VAULT_PATH;

  if (!vaultPath) {
    throw createPublishError('CONFIG', 'OBSIDIAN_VAULT_PATH is required.');
  }

  const absoluteVaultPath = path.resolve(vaultPath);
  let vaultStats;

  try {
    vaultStats = await stat(absoluteVaultPath);
  } catch (error) {
    throw createPublishError('CONFIG', `Configured vault path does not exist: ${absoluteVaultPath}.`);
  }

  if (!vaultStats.isDirectory()) {
    throw createPublishError('CONFIG', `Configured vault path is not a directory: ${absoluteVaultPath}.`);
  }

  const sourceDir = path.join(absoluteVaultPath, 'Rascunhos');
  const archiveDir = path.join(absoluteVaultPath, 'Publicados');

  return {
    vaultPath: absoluteVaultPath,
    sourceDir,
    archiveDir,
  };
}

export async function ensureVaultStructure(paths) {
  await mkdir(paths.sourceDir, { recursive: true });
  await mkdir(paths.archiveDir, { recursive: true });
}

function validateNonEmptyField(frontmatter, field) {
  const value = normalizeFrontmatterValue(frontmatter[field] || '');

  if (!value) {
    throw createPublishError('EDITORIAL', `${field} must not be empty.`);
  }

  return value;
}

function validatePlaceholderValue(field, value) {
  const placeholders = TEMPLATE_PLACEHOLDERS[field] || [];

  if (!placeholders.includes(value.toLowerCase())) {
    return;
  }

  if (field === 'canonicalSlug') {
    throw createPublishError('EDITORIAL', 'canonicalSlug must be replaced with a real slug before publishing.');
  }

  throw createPublishError('EDITORIAL', `${field} must be replaced with a real editorial value before publishing.`);
}

function extractTagItems(rawContent) {
  const frontmatterBlock = extractFrontmatterBlock(rawContent);
  const lines = frontmatterBlock.split('\n');
  const items = [];
  let insideTags = false;

  for (const line of lines) {
    if (!insideTags) {
      if (line.trim() === 'tags:') {
        insideTags = true;
      }
      continue;
    }

    if (/^\s+-\s+/.test(line)) {
      items.push(normalizeFrontmatterValue(line.replace(/^\s+-\s+/, '')));
      continue;
    }

    if (/^\s*$/.test(line)) {
      continue;
    }

    break;
  }

  return items.filter(Boolean);
}

export function buildTemplateContent(language) {
  const normalizedLanguage = validateLanguage(language);
  const templateDate = new Date().toISOString().slice(0, 10);

  if (normalizedLanguage === 'pt') {
    return `---
title: 'Titulo provisorio do post'
description: 'Resumo em 1 ou 2 frases sobre o que o leitor vai aprender.'
author: 'Mateus Campos'
pubDate: '${templateDate}'
draft: true
lang: 'pt'
category: 'agricultura-digital'
tags:
  - 'api'
  - 'dados'
series: ''
canonicalSlug: 'titulo-do-post-em-kebab-case'
portfolioFeatured: false
portfolioSummary: ''
heroImage: ''
---

Antes de publicar, revise title, description, category, tags e canonicalSlug.

Use portfolioFeatured: true apenas se este post tambem merecer destaque no portfolio.

Se portfolioFeatured for true, preencha portfolioSummary com 1 ou 2 frases curtas.

## Contexto

Explique o contexto do tema e por que ele importa.

## Problema ou oportunidade

Descreva a dor, a pergunta ou a oportunidade que este post aborda.

## Solucao ou analise

Apresente a explicacao principal, os exemplos, os dados ou a analise tecnica.

## Proximos passos

Registre a sintese final, recomendacoes e proximos desdobramentos.

## Referencias

Liste livros, artigos, documentacao, relatorios ou links que sustentam o texto.
`;
  }

  return `---
title: 'Working post title'
description: 'Summarize in 1 or 2 sentences what the reader will learn.'
author: 'Mateus Campos'
pubDate: '${templateDate}'
draft: true
lang: 'en'
category: 'digital-agriculture'
tags:
  - 'api'
  - 'integration'
series: ''
canonicalSlug: 'post-title-in-kebab-case'
portfolioFeatured: false
portfolioSummary: ''
heroImage: ''
---

Before publishing, review title, description, category, tags, and canonicalSlug.

Use portfolioFeatured: true only when this article should also be featured in the portfolio.

If portfolioFeatured is true, fill portfolioSummary with 1 or 2 short sentences.

## Context

Explain the context of the topic and why it matters.

## Problem or opportunity

Describe the pain point, open question, or opportunity this post addresses.

## Solution or analysis

Present the main explanation, examples, data, or technical analysis.

## Next steps

Capture the conclusion, recommendations, and possible follow-up work.

## References

List the books, papers, documentation, reports, or links that support the article.
`;
}

export async function initializePostTemplate(language = 'pt', env = process.env) {
  const selectedLanguage = validateLanguage(language);
  const vaultPaths = await resolveVaultPaths(env);
  await ensureVaultStructure(vaultPaths);

  const templatesDir = path.join(vaultPaths.vaultPath, 'Templates');
  await mkdir(templatesDir, { recursive: true });

  const templatePath = path.join(templatesDir, `Blog-Post-Template-${selectedLanguage}.md`);
  await writeFile(templatePath, buildTemplateContent(selectedLanguage), 'utf8');

  return {
    language: selectedLanguage,
    templatePath,
  };
}

export function validatePostFrontmatter(frontmatter, selectedLanguage) {
  for (const field of REQUIRED_FRONTMATTER_FIELDS) {
    if (!(field in frontmatter)) {
      throw createPublishError('EDITORIAL', `Missing required frontmatter field: ${field}.`);
    }
  }

  for (const field of REQUIRED_NON_EMPTY_FIELDS) {
    const value = validateNonEmptyField(frontmatter, field);
    validatePlaceholderValue(field, value);
  }

  const fileLanguage = normalizeFrontmatterValue(frontmatter.lang);
  validateLanguage(fileLanguage);

  const draftValue = normalizeFrontmatterValue(frontmatter.draft).toLowerCase();
  if (draftValue === 'true') {
    throw createPublishError('DRAFT', 'Draft posts cannot be published. Set draft: false before publishing.');
  }

  if (fileLanguage !== selectedLanguage) {
    throw createPublishError('LANGUAGE', `Frontmatter lang "${fileLanguage}" does not match selected language "${selectedLanguage}".`);
  }

  const pubDate = normalizeFrontmatterValue(frontmatter.pubDate);
  if (Number.isNaN(Date.parse(pubDate))) {
    throw createPublishError('EDITORIAL', 'pubDate must be a valid date.');
  }

  const updatedDate = normalizeFrontmatterValue(frontmatter.updatedDate || '');
  if (updatedDate && Number.isNaN(Date.parse(updatedDate))) {
    throw createPublishError('EDITORIAL', 'updatedDate must be a valid date when provided.');
  }

  parseBooleanLiteral(frontmatter.draft);

  const portfolioFeatured = frontmatter.portfolioFeatured ? parseBooleanLiteral(frontmatter.portfolioFeatured) : false;
  const portfolioSummary = normalizeFrontmatterValue(frontmatter.portfolioSummary || '');

  if (portfolioFeatured && !portfolioSummary) {
    throw createPublishError('EDITORIAL', 'portfolioSummary is required when portfolioFeatured is true.');
  }

  const slug = normalizeFrontmatterValue(frontmatter.canonicalSlug);

  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw createPublishError('EDITORIAL', 'canonicalSlug must use kebab-case ASCII characters.');
  }

  return { slug, fileLanguage };
}

export async function findDuplicateSlug(destDir, slug) {
  const files = await readdir(destDir, { withFileTypes: true });

  for (const file of files) {
    if (!file.isFile()) {
      continue;
    }

    if (!file.name.endsWith('.md') && !file.name.endsWith('.mdx')) {
      continue;
    }

    const content = await readFile(path.join(destDir, file.name), 'utf8');
    const frontmatter = extractFrontmatter(content);

    if (normalizeFrontmatterValue(frontmatter.canonicalSlug || '') === slug) {
      return file.name;
    }
  }

  return null;
}

export async function publishPost(postFile, language = 'pt', env = process.env) {
  if (!postFile) {
    throw createPublishError('USAGE', 'Usage: ./scripts/publish-post.sh <arquivo.md|arquivo.mdx> [idioma]');
  }

  if (!postFile.endsWith('.md') && !postFile.endsWith('.mdx')) {
    throw createPublishError('EXTENSION', 'Only .md or .mdx files are supported. Use a draft file inside Rascunhos/.');
  }

  const selectedLanguage = validateLanguage(language);
  const vaultPaths = await resolveVaultPaths(env);
  await ensureVaultStructure(vaultPaths);

  const sourceFile = path.join(vaultPaths.sourceDir, postFile);
  const contentRoot = env.A2C_CONTENT_ROOT || 'src/content/blog';
  const destDir = path.join(contentRoot, selectedLanguage);
  const archiveFile = path.join(vaultPaths.archiveDir, postFile);

  let rawContent;
  try {
    rawContent = await readFile(sourceFile, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') {
      throw createPublishError('FILE', `Draft file not found in Rascunhos: ${postFile}.`);
    }
    throw error;
  }
  const frontmatter = extractFrontmatter(rawContent);
  const tagItems = extractTagItems(rawContent);
  if (tagItems.length === 0) {
    throw createPublishError('EDITORIAL', 'tags must include at least one item.');
  }
  const { slug } = validatePostFrontmatter(frontmatter, selectedLanguage);

  await mkdir(destDir, { recursive: true });

  const duplicateFile = await findDuplicateSlug(destDir, slug);
  if (duplicateFile) {
    throw createPublishError('DUPLICATE', `canonicalSlug "${slug}" already exists in ${path.join(destDir, duplicateFile)}.`);
  }

  await copyFile(sourceFile, path.join(destDir, postFile));
  await rename(sourceFile, archiveFile);

  return {
    slug,
    language: selectedLanguage,
    destination: path.join(destDir, postFile),
    archiveFile,
  };
}

export async function runCli(args = process.argv.slice(2), env = process.env, io = console) {
  const [commandOrPostFile, language = 'pt'] = args;

  try {
    const runtimeEnv = await resolveRuntimeEnv(env);

    if (commandOrPostFile === '--init-template') {
      const result = await initializePostTemplate(language, runtimeEnv);

      io.log(`Initialized template at ${result.templatePath}`);
      return 0;
    }

    const result = await publishPost(commandOrPostFile, language, runtimeEnv);

    io.log(`Published ${result.destination}`);
    io.log(`Archived source at ${result.archiveFile}`);
    io.log(`Canonical URL segment: ${result.slug}`);
    return 0;
  } catch (error) {
    io.error(`Publish failed: ${error.message}`);
    io.error(getCliTipForError(error));
    return 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  process.exitCode = await runCli();
}
