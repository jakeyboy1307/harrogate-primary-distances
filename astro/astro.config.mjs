import { defineConfig } from 'astro/config';

// The site lives at the root of yorkshireschoolchecker.co.uk (a Cloudflare Worker, see wrangler.jsonc).
// `site` also sets the canonical links and the sitemap addresses.
// SITE_BASE still lets a build run under a sub-path, e.g. SITE_BASE=/harrogate-primary-distances npm run build
export default defineConfig({
  site: 'https://yorkshireschoolchecker.co.uk',
  base: process.env.SITE_BASE || '/',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
