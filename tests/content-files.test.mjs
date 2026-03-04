import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const requiredFields = [
  'title:',
  'description:',
  'author:',
  'pubDate:',
  'draft:',
  'lang:',
  'category:',
  'tags:',
  'canonicalSlug:',
];

async function getContentFiles() {
  const languages = ['en', 'pt'];
  const files = [];

  for (const language of languages) {
    const dir = path.join('src/content/blog', language);
    const entries = await readdir(dir);

    for (const entry of entries) {
      if (entry.endsWith('.md') || entry.endsWith('.mdx')) {
        files.push(path.join(dir, entry));
      }
    }
  }

  return files;
}

test('all content files include the required frontmatter contract', async () => {
  const files = await getContentFiles();
  assert.ok(files.length > 0);

  for (const file of files) {
    const content = await readFile(file, 'utf8');
    const frontmatter = content.match(/^---\n([\s\S]*?)\n---/);

    assert.ok(frontmatter, `Missing frontmatter in ${file}`);

    for (const field of requiredFields) {
      assert.match(frontmatter[1], new RegExp(`(^|\\n)${field.replace(':', '\\:')}`), `${file} is missing ${field}`);
    }

    const expectedLanguage = file.includes('/pt/') ? "'pt'" : "'en'";
    assert.match(frontmatter[1], new RegExp(`(^|\\n)lang:\\s*${expectedLanguage}`), `${file} has an invalid lang value`);
  }
});

