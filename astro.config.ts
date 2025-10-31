import { loadEnv } from "vite";
import { defineConfig } from 'astro/config';

import expressiveCode from 'astro-expressive-code';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import spectre from './package/src';

import node from '@astrojs/node';

import vitesseBlack from '@shikijs/themes/vitesse-black';


// https://astro.build/config
const config = defineConfig({
  site: 'https://rentri.github.io',
  output: 'static',
  integrations: [
    expressiveCode({
      themes: [vitesseBlack],
    }),
    mdx(),
    sitemap(),
    spectre({
      name: 'rentri',
      openGraph: {
        home: {
          title: 'rentri',
        },
        til: {
          title: 'TIL',
          description: 'Today I Learned'
        },
        blog: {
          title: 'Blog',
        },
        projects: {
          title: 'Projects'
        }
      },
      giscus: {
        repository: 'rentri/rentri.github.io',
        repositoryId: 'R_kgDOO_bTYw',
        category: 'General',
        categoryId: 'DIC_kwDOO_bTY84Cs1Je',
        mapping: 'pathname',
        strict: true,
        reactionsEnabled: true,
        emitMetadata: false,
        commentsInput: 'top',
        theme: 'noborder_gray',
        lang: 'en',
        }
    })
  ],
  // adapter: node({
  //   mode: 'standalone'
  // })
});

export default config;
