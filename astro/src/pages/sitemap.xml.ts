// The sitemap index that robots.txt and Search Console point to: one sitemap per area, plus one for the other pages
// (lib/sitemaps.ts). New areas and pages are picked up automatically.
import type { APIRoute } from 'astro';
import { url } from '../lib/url';
import { SITEMAPS } from '../lib/sitemaps';

export const GET: APIRoute = ({ site }) => {
  const maps = SITEMAPS.map((n) => `  <sitemap><loc>${new URL(url(`sitemap-${n}.xml`), site).href}</loc></sitemap>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${maps}\n</sitemapindex>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
