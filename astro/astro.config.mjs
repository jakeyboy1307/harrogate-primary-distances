import { defineConfig } from 'astro/config';

// The site lives at the root of yorkshireschoolchecker.co.uk (a Cloudflare Worker, see wrangler.jsonc).
// `site` also sets the canonical links and the sitemap addresses.
// SITE_BASE still lets a build run under a sub-path, e.g. SITE_BASE=/harrogate-primary-distances npm run build
// Demo sponsors (src/lib/sponsors-demo.ts) show on preview builds of other branches and on local builds,
// never on a build of main. Cloudflare's Workers Builds sets WORKERS_CI and WORKERS_CI_BRANCH; if the branch
// is ever missing on Cloudflare, the demos stay off.
const branch = process.env.WORKERS_CI_BRANCH;
const demoSponsors = branch ? branch !== 'main' : !process.env.WORKERS_CI && !process.env.CI;
console.log(`[sponsors] branch ${branch ?? '(local)'}: demo sponsors ${demoSponsors ? 'on' : 'off'}`);

export default defineConfig({
  vite: { define: { __DEMO_SPONSORS__: JSON.stringify(demoSponsors) } },
  site: 'https://yorkshireschoolchecker.co.uk',
  base: process.env.SITE_BASE || '/',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
