// The sitemaps: one per area (its area page and every school page in it) plus one for the other pages, listed in
// sitemap.xml. Search Console's Pages report can be filtered by sitemap, so each area's indexing can be watched
// on its own. School and area pages carry the date their own council's data was last refreshed, so refreshing one
// council doesn't re-date every page on the site; other pages carry no date rather than a made-up one.
import { councilDate, dataDate } from './areas';
import { schoolPages } from './schoolpages';
import { AREA_INFO, type Area } from './specs';
import { townsOf } from './towns';

export interface Entry { path: string; lastmod?: string }

export { dataDate };

// top-level pages: every .astro file in src/pages, less the ones kept out of search
const NOT_FOR_SEARCH = ['404', 'advertise'];
const topLevel = Object.keys(import.meta.glob('../pages/*.astro'))
  .map((f) => f.slice('../pages/'.length, -'.astro'.length))
  .filter((p) => !NOT_FOR_SEARCH.includes(p) && !p.startsWith('['))   // [town].astro: the town pages, in their area's sitemap
  .map((p) => (p === 'index' ? '' : `${p}/`));

export const SITEMAPS = ['pages', ...(Object.keys(AREA_INFO) as Area[])];

export function sitemapEntries(name: string): Entry[] {
  if (name === 'pages') {
    const areaPages = new Set(Object.values(AREA_INFO).map((a) => a.page));
    return topLevel.filter((p) => !areaPages.has(p)).sort().map((path) => ({ path }));
  }
  const area = AREA_INFO[name as Area];
  const lastmod = councilDate(area.council) ?? dataDate();
  return [
    { path: area.page, lastmod },
    ...townsOf(name as Area).map((t) => ({ path: t.page, lastmod })),
    ...schoolPages().filter((p) => p.area === name).map((p) => ({ path: `schools/${p.slug}/`, lastmod })).sort((a, b) => a.path.localeCompare(b.path)),
  ];
}
