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
  const match = rawContent.match(/^---\n([\s\S]*?)\n---/);

  if (!match) {
    throw new Error('Missing YAML frontmatter.');
  }

  const entries = {};

  for (const line of match[1].split('\n')) {
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
    throw new Error('draft must be true or false.');
  }

  return normalized === 'true';
}

export function validateLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new Error(`Unsupported language "${language}". Use one of: ${SUPPORTED_LANGUAGES.join(', ')}.`);
  }

  return language;
}

export async function resolveVaultPaths(env = process.env) {
  const vaultPath = env.OBSIDIAN_VAULT_PATH;

  if (!vaultPath) {
    throw new Error('OBSIDIAN_VAULT_PATH is required.');
  }

  const absoluteVaultPath = path.resolve(vaultPath);
  let vaultStats;

  try {
    vaultStats = await stat(absoluteVaultPath);
  } catch (error) {
    throw new Error(`Configured vault path does not exist: ${absoluteVaultPath}.`);
  }

  if (!vaultStats.isDirectory()) {
    throw new Error(`Configured vault path is not a directory: ${absoluteVaultPath}.`);
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

export function buildTemplateContent(language) {
  const normalizedLanguage = validateLanguage(language);

  if (normalizedLanguage === 'pt') {
    return `---
title: 'Titulo do post'
description: 'Resumo objetivo do conteudo'
author: 'Mateus Campos'
pubDate: 'Mar 04 2026'
updatedDate: ''
draft: true
lang: 'pt'
category: 'categoria-principal'
tags:
  - 'tag-1'
  - 'tag-2'
series: ''
canonicalSlug: 'titulo-do-post-em-kebab-case'
portfolioFeatured: false
portfolioSummary: 'Resumo curto para destaque no portfolio'
heroImage: '/agro2code-blog/blog-placeholder-1.jpg'
---

## Resumo

Descreva rapidamente o objetivo do post.

## Desenvolvimento

Escreva o conteudo principal aqui.

## Conclusao

Registre a sintese final e os proximos passos.
`;
  }

  return `---
title: 'Post title'
description: 'Short summary of the content'
author: 'Mateus Campos'
pubDate: 'Mar 04 2026'
updatedDate: ''
draft: true
lang: 'en'
category: 'main-category'
tags:
  - 'tag-1'
  - 'tag-2'
series: ''
canonicalSlug: 'post-title-in-kebab-case'
portfolioFeatured: false
portfolioSummary: 'Short summary for portfolio highlights'
heroImage: '/agro2code-blog/blog-placeholder-1.jpg'
---

## Summary

Describe the purpose of the post.

## Development

Write the main content here.

## Conclusion

Capture the main outcome and next steps.
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
      throw new Error(`Missing required frontmatter field: ${field}.`);
    }
  }

  const fileLanguage = normalizeFrontmatterValue(frontmatter.lang);
  validateLanguage(fileLanguage);

  const draftValue = normalizeFrontmatterValue(frontmatter.draft).toLowerCase();
  if (draftValue === 'true') {
    throw new Error('Draft posts cannot be published. Set draft: false before publishing.');
  }

  if (fileLanguage !== selectedLanguage) {
    throw new Error(`Frontmatter lang "${fileLanguage}" does not match selected language "${selectedLanguage}".`);
  }

  const pubDate = normalizeFrontmatterValue(frontmatter.pubDate);
  if (Number.isNaN(Date.parse(pubDate))) {
    throw new Error('pubDate must be a valid date.');
  }

  parseBooleanLiteral(frontmatter.draft);

  const portfolioFeatured = frontmatter.portfolioFeatured ? parseBooleanLiteral(frontmatter.portfolioFeatured) : false;
  const portfolioSummary = normalizeFrontmatterValue(frontmatter.portfolioSummary || '');

  if (portfolioFeatured && !portfolioSummary) {
    throw new Error('portfolioSummary is required when portfolioFeatured is true.');
  }

  const slug = normalizeFrontmatterValue(frontmatter.canonicalSlug);

  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw new Error('canonicalSlug must use kebab-case ASCII characters.');
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
    throw new Error('Usage: ./scripts/publish-post.sh <arquivo.md|arquivo.mdx> [idioma]');
  }

  if (!postFile.endsWith('.md') && !postFile.endsWith('.mdx')) {
    throw new Error('Only .md or .mdx files are supported. Use a draft file inside Rascunhos/.');
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
      throw new Error(`Draft file not found in Rascunhos: ${postFile}.`);
    }
    throw error;
  }
  const frontmatter = extractFrontmatter(rawContent);
  const { slug } = validatePostFrontmatter(frontmatter, selectedLanguage);

  await mkdir(destDir, { recursive: true });

  const duplicateFile = await findDuplicateSlug(destDir, slug);
  if (duplicateFile) {
    throw new Error(`canonicalSlug "${slug}" already exists in ${path.join(destDir, duplicateFile)}.`);
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

async function runCli() {
  const [postFile, language = 'pt'] = process.argv.slice(2);

  try {
    const runtimeEnv = await resolveRuntimeEnv();
    const result = await publishPost(postFile, language, runtimeEnv);

    console.log(`Published ${result.destination}`);
    console.log(`Archived source at ${result.archiveFile}`);
    console.log(`Canonical URL segment: ${result.slug}`);
  } catch (error) {
    console.error(`Publish failed: ${error.message}`);
    console.error('Tip: verify language, frontmatter contract, file extension, and draft location in Rascunhos/.');
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runCli();
}
