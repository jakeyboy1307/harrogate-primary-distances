// One sitemap per area, plus sitemap-pages.xml for everything else, all listed in sitemap.xml (lib/sitemaps.ts)
import type { APIRoute, GetStaticPaths } from 'astro';
import { url } from '../lib/url';
import { SITEMAPS, sitemapEntries } from '../lib/sitemaps';

export const getStaticPaths: GetStaticPaths = () => SITEMAPS.map((name) => ({ params: { name } }));

export const GET: APIRoute = ({ params, site }) => {
  const urls = sitemapEntries(params.name!)
    .map((e) => `  <url><loc>${new URL(url(e.path), site).href}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ''}</url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
