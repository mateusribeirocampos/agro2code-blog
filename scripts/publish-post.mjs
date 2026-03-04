import { copyFile, mkdir, readFile, rename, readdir, stat } from 'node:fs/promises';
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

export function validatePostFrontmatter(frontmatter, selectedLanguage) {
  for (const field of REQUIRED_FRONTMATTER_FIELDS) {
    if (!(field in frontmatter)) {
      throw new Error(`Missing required frontmatter field: ${field}.`);
    }
  }

  const fileLanguage = normalizeFrontmatterValue(frontmatter.lang);
  validateLanguage(fileLanguage);

  if (fileLanguage !== selectedLanguage) {
    throw new Error(`Frontmatter lang "${fileLanguage}" does not match selected language "${selectedLanguage}".`);
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

  const selectedLanguage = validateLanguage(language);
  const vaultPaths = await resolveVaultPaths(env);
  await ensureVaultStructure(vaultPaths);

  const sourceFile = path.join(vaultPaths.sourceDir, postFile);
  const contentRoot = env.A2C_CONTENT_ROOT || 'src/content/blog';
  const destDir = path.join(contentRoot, selectedLanguage);
  const archiveFile = path.join(vaultPaths.archiveDir, postFile);

  const rawContent = await readFile(sourceFile, 'utf8');
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
    const result = await publishPost(postFile, language);

    console.log(`Published ${result.destination}`);
    console.log(`Archived source at ${result.archiveFile}`);
    console.log(`Canonical URL segment: ${result.slug}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await runCli();
}
