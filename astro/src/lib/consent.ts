// Google Analytics, through the Google Tag Manager container below (it holds the GA4 tag, G-NR6T0LHP0J). The tag is
// first in <head> on every page (layouts/Base.astro) and runs for visit statistics without asking first: PECR's
// statistical-purposes exception (Data (Use and Access) Act 2025, in force 5 February 2026) allows that when
// visitors are told clearly and can object simply, the data is only used to improve the site, and Google acts only
// as our processor (Analytics' data-sharing settings off, Google signals off, no advertising features). The cookie
// notice (components/CookieBanner.astro) tells visitors, and its "Turn off" objects: then Analytics sends nothing
// and its cookies are deleted. The choice is remembered in localStorage, not a cookie. The site's own visit counter
// (lib/track.ts) uses no cookies and runs either way.
//
// The site owner's browsers count nowhere: opening /admin marks the browser (layouts/Admin.astro), and both the
// counter and Analytics skip a marked browser, so the admin dashboard and GA only show real visitors.

export const GTM_ID = 'GTM-T5VDVN69';   // also written into layouts/Base.astro
const KEY = 'ysc-consent';
const OWNER = 'ysc-owner';
const YEAR = 365 * 24 * 60 * 60 * 1000;

export type Choice = 'granted' | 'denied';

// 'granted': saw the notice and left Analytics on. 'denied': turned it off. null: hasn't answered the notice (or did
// over a year ago, so it's shown again; Analytics stays off for someone who turned it off, layouts/Base.astro)
export function getChoice(): Choice | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if ((v?.c === 'granted' || v?.c === 'denied') && Date.now() - v.t < YEAR) return v.c;
  } catch { /* storage blocked: ask again */ }
  return null;
}
export function setChoice(c: Choice) {
  try { localStorage.setItem(KEY, JSON.stringify({ c, t: Date.now() })); } catch { /* storage blocked */ }
}

export const isOwner = () => { try { return localStorage.getItem(OWNER) === '1'; } catch { return false; } };
export const markOwner = () => { try { localStorage.setItem(OWNER, '1'); } catch { /* storage blocked */ } };

type W = Window & { gtag?: (...a: unknown[]) => void };

const GA = 'ga-disable-G-NR6T0LHP0J';
// After OK, or switching back on from Cookie settings: Analytics may use its cookies and send visits again
export function grantAnalytics() {
  if (isOwner()) return;
  (window as unknown as Record<string, boolean>)[GA] = false;
  (window as W).gtag?.('consent', 'update', { analytics_storage: 'granted' });
}

// After Turn off: Analytics sends nothing more (Google's own opt-out flag), and its cookies (_ga, _ga_<id>) are deleted
export function stopAnalytics() {
  const w = window as W;
  (window as unknown as Record<string, boolean>)[GA] = true;
  w.gtag?.('consent', 'update', { analytics_storage: 'denied' });
  const host = location.hostname, parts = host.split('.');
  const domains = ['', host, `.${host}`, ...parts.slice(1).map((_, i) => `.${parts.slice(i + 1).join('.')}`)];
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0].trim();
    if (!/^_ga(_|$)|^_gid$|^_gat/.test(name)) continue;
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`;
  }
}
