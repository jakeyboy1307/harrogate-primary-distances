// Google Analytics, through the Google Tag Manager container below (it holds the GA4 tag, G-HQLZX5MSCC), and only
// after a visitor clicks Accept on the cookie banner (components/CookieBanner.astro). Until then nothing from
// Google loads. The choice is remembered in localStorage, not a cookie, for a year; "Cookie settings" in the footer
// asks again. The site's own visit counter (lib/track.ts) uses no cookies and runs either way.
//
// The site owner's browsers count nowhere: opening /admin marks the browser (layouts/Admin.astro), and both the
// counter and Analytics skip a marked browser, so the admin dashboard and GA only show real visitors.

export const GTM_ID = 'GTM-WWGVRHZC';
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

type W = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void };
let loaded = false;

// Load Tag Manager, once. Only ever called after an Accept, now or on an earlier visit.
export function loadAnalytics() {
  if (loaded || isOwner()) return;
  loaded = true;
  const w = window as W;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() { w.dataLayer!.push(arguments); };
  // analytics only: Google's advertising features stay off whatever the container says
  w.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
  // Never a postcode. The checker keeps it after # (#pc=HG20NA), which Analytics doesn't read, and a form sent
  // before the page's script loaded arrives as ?pc=…; both are left out of the address Google is given.
  const q = new URLSearchParams(location.search);
  q.delete('pc'); q.delete('school');
  const qs = q.toString();
  w.gtag('set', {
    page_location: `${location.origin}${location.pathname}${qs ? `?${qs}` : ''}`,
    allow_google_signals: false, allow_ad_personalization_signals: false,
  });
  w.gtag('js', new Date());
  w.dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(s);
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
