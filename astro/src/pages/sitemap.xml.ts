// The list of pages for search engines (robots.txt points here). New pages are picked up automatically; 404 is left out.
import type { APIRoute } from 'astro';
import { url } from '../lib/url';

const pages = Object.keys(import.meta.glob('./*.astro'))
  .map((f) => f.slice(2, -'.astro'.length))
  .filter((p) => p !== '404')
  .map((p) => (p === 'index' ? '' : `${p}/`))
  .sort();

export const GET: APIRoute = ({ site }) => {
  const urls = pages.map((p) => `  <url><loc>${new URL(url(p), site).href}</loc></url>`).join('\n');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } },
  );
};
