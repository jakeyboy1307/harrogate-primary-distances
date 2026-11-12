// Google Analytics, through the Google Tag Manager container below (it holds the GA4 tag, G-NR6T0LHP0J). The tag is
// on every page (layouts/Base.astro) with Google's Consent Mode set to denied, so it stores no cookies until the
// visitor clicks Accept on the cookie banner (components/CookieBanner.astro). The choice is remembered in
// localStorage, not a cookie, for a year; "Cookie settings" in the footer asks again. The site's own visit counter
// (lib/track.ts) uses no cookies and runs either way.
//
// The site owner's browsers count nowhere: opening /admin marks the browser (layouts/Admin.astro), and both the
// counter and Analytics skip a marked browser, so the admin dashboard and GA only show real visitors.

export const GTM_ID = 'GTM-T5VDVN69';   // also written into layouts/Base.astro
const KEY = 'ysc-consent';
const OWNER = 'ysc-owner';
const YEAR = 365 * 24 * 60 * 60 * 1000;

export type Choice = 'granted' | 'denied';

// the visitor's choice, or null if they haven't made one (or made it over a year ago)
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

// After an Accept: let Analytics use its cookies from now on. The tag itself is already on every page (first in
// <head>, layouts/Base.astro), waiting with analytics storage denied; a visitor who accepted before starts granted.
export function grantAnalytics() {
  if (isOwner()) return;
  (window as W).gtag?.('consent', 'update', { analytics_storage: 'granted' });
}

// After a Reject that follows an Accept: tell Google to stop, and delete its cookies (_ga, _ga_<id>, _gid)
export function stopAnalytics() {
  const w = window as W;
  w.gtag?.('consent', 'update', { analytics_storage: 'denied' });
  const host = location.hostname, parts = host.split('.');
  const domains = ['', host, `.${host}`, ...parts.slice(1).map((_, i) => `.${parts.slice(i + 1).join('.')}`)];
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0].trim();
    if (!/^_ga(_|$)|^_gid$|^_gat/.test(name)) continue;
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`;
  }
}
