// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://mateusribeirocampos.github.io',
  base: '/agro2code-blog',
  integrations: [mdx(), sitemap({
    changefreq: 'daily',
    priority: 0.7,
    lastmod: new Date(),
    customPages: [
      'https://mateusribeirocampos.github.io/agro2code-blog/about',
      'https://mateusribeirocampos.github.io/agro2code-blog/pt/about'
    ],
    entryLimit: 1000,
    i18n: {
      defaultLocale: 'en',
      locales: {
        pt: 'pt-BR',
        en: 'en-US',
      }
    },
  })],
});
