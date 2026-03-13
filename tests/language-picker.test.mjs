import test from 'node:test';
import assert from 'node:assert/strict';

import { buildLanguagePickerHref, translatePathForLanguage } from '../src/utils/language-picker.js';

test('translatePathForLanguage converts default-language paths to pt', () => {
  assert.equal(translatePathForLanguage('/blog/', 'pt'), '/pt/blog/');
});

test('translatePathForLanguage removes pt prefix when switching to en', () => {
  assert.equal(translatePathForLanguage('/pt/blog/post/', 'en'), '/blog/post/');
});

test('buildLanguagePickerHref does not duplicate base for translated public paths', () => {
  assert.equal(
    buildLanguagePickerHref({
      base: '/agro2code-blog',
      currentPath: '/pt/blog/post/',
      code: 'en',
      translatedPath: '/agro2code-blog/blog/post/',
    }),
    '/agro2code-blog/blog/post/',
  );
});

test('buildLanguagePickerHref prefixes base for fallback translated paths', () => {
  assert.equal(
    buildLanguagePickerHref({
      base: '/agro2code-blog',
      currentPath: '/blog/post/',
      code: 'pt',
    }),
    '/agro2code-blog/pt/blog/post/',
  );
});
