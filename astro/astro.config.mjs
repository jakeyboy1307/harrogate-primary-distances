import { defineConfig } from 'astro/config';

// SITE_BASE lets the same build run at the root locally and under a sub-path on GitHub Pages,
// e.g. SITE_BASE=/harrogate-primary-distances npm run build
export default defineConfig({
  base: process.env.SITE_BASE || '/',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
