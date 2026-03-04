import { mkdir } from 'node:fs/promises';

await mkdir('node_modules/.astro', { recursive: true });

