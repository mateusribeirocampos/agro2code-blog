// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://portfolio-mateusribeirocampos.vercel.app/en',
  integrations: [mdx(), sitemap({
    changefreq: 'daily',
    priority: 0.7,
    lastmod: new Date(),
    customPages: ['/en/about'],
    entryLimit: 1000,
    i18n: {
      defaultLocale: 'pt',
      locales: {
        pt: 'pt-BR',
        en: 'en-US',
      }
    },
  })],
});
