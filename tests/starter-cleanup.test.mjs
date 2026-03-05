import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('i18n labels do not keep starter-template astronaut copy', async () => {
  const uiConfig = await readFile('src/i18n/ui.ts', 'utf8');

  assert.doesNotMatch(uiConfig, /Hello,\s*Astronaut!/i);
  assert.doesNotMatch(uiConfig, /Olá,\s*Astronauta!/i);
});

test('header does not keep starter-template TODO comments', async () => {
  const header = await readFile('src/components/Header.astro', 'utf8');

  assert.doesNotMatch(header, /TODO:\s*Add support for other languages/i);
});

test('global styles do not reference starter template origin notes', async () => {
  const globalStyles = await readFile('src/styles/global.css', 'utf8');

  assert.doesNotMatch(globalStyles, /Bear Blog's default CSS/i);
});
