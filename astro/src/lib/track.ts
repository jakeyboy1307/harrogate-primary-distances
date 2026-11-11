// Counts for the admin dashboard: page views, searches by area, school panels opened, and ad views and clicks.
// They're sent to /api/hit (astro/worker/index.js) as daily totals. No cookies, no ID, nothing that identifies
// anyone, and nothing is stored in the browser.

type Kind = 'page' | 'search' | 'panel' | 'ad_view' | 'ad_click' | 'source';
const queue = new Map<string, [Kind, string, number]>();
let timer: number | undefined;

function flush() {
  clearTimeout(timer);
  if (!queue.size) return;
  const body = JSON.stringify({ e: [...queue.values()] });
  queue.clear();
  // sendBeacon survives the page closing; text/plain avoids a pre-flight request
  const sent = navigator.sendBeacon?.('/api/hit', new Blob([body], { type: 'text/plain' }));
  if (!sent) fetch('/api/hit', { method: 'POST', body, keepalive: true }).catch(() => {});
}

export function track(kind: Kind, key: string) {
  const id = `${kind}|${key}`;
  const e = queue.get(id);
  if (e) e[2] = Math.min(20, e[2] + 1); else queue.set(id, [kind, key, 1]);
  clearTimeout(timer);
  timer = window.setTimeout(flush, 4000);
}

// Where a visit came from, counted once when someone arrives from outside the site: a ?from= tag on links we hand
// out (flyers, posts: "?from=nursery-flyer"), else the referring site's name ("google", "facebook", "thestar.co.uk").
// Never the full address it came from, and nothing about the person.
const NAMED: [RegExp, string][] = [
  [/(^|\.)google\./, 'google'], [/(^|\.)bing\.com$/, 'bing'], [/(^|\.)duckduckgo\.com$/, 'duckduckgo'], [/(^|\.)yahoo\./, 'yahoo'],
  [/(^|\.)ecosia\.org$/, 'ecosia'], [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, 'facebook'], [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)(t\.co|twitter\.com|x\.com)$/, 'x'], [/(^|\.)reddit\.com$/, 'reddit'], [/(^|\.)mumsnet\.com$/, 'mumsnet'],
  [/(^|\.)nextdoor\./, 'nextdoor'], [/(^|\.)linkedin\.com$/, 'linkedin'], [/(^|\.)(chatgpt\.com|openai\.com)$/, 'chatgpt'],
  [/(^|\.)perplexity\.ai$/, 'perplexity'], [/(^|\.)whatsapp\.(com|net)$/, 'whatsapp'],
];
function arrivedFrom(): string | null {
  const tag = new URLSearchParams(location.search).get('from')?.toLowerCase();
  if (tag && /^[a-z0-9-]{1,30}$/.test(tag)) return `tag:${tag}`;
  if (document.referrer.startsWith('android-app:')) return 'direct';   // an Android app (Gmail's would look like "google")
  let host = '';
  try { host = document.referrer ? new URL(document.referrer).hostname.toLowerCase() : ''; } catch { /* not a web address */ }
  if (host === location.hostname) return null;   // moving between our own pages
  if (!host) return 'direct';                    // typed, bookmarked, or an app that sends no referrer (WhatsApp, email)
  host = host.replace(/^(www|m|l|lm)\./, '');
  return NAMED.find(([re]) => re.test(host))?.[1] ?? (/^[a-z0-9.-]{1,60}$/.test(host) ? host : 'other');
}

let started = false;
// Watch for ads on the page: count a view once an ad is at least half on screen (once per ad per page view),
// and a click on its button or link. Ads carry data-ad-id and data-ad-slot (src/lib/sponsors.ts).
export function startTracking(page: string) {
  if (started) return;
  started = true;
  track('page', page);
  const from = arrivedFrom();
  if (from) track('source', from);
  addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });

  const seen = new Set<string>();
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const el = en.target as HTMLElement, key = `${el.dataset.adId}:${el.dataset.adSlot}`;
      io.unobserve(el);
      if (!seen.has(key)) { seen.add(key); track('ad_view', key); }
    }
  }, { threshold: 0.5 });
  const watch = (root: ParentNode) => root.querySelectorAll<HTMLElement>('[data-ad-id]').forEach((el) => {
    if (/^\d+$/.test(el.dataset.adId ?? '')) io.observe(el);
  });
  watch(document);
  // ads are drawn after the page loads (and redrawn when the results change), or an element already on the
  // page is given an ad (the area page sponsor line), so watch for both
  new MutationObserver((list) => {
    for (const m of list) {
      if (m.type === 'attributes') { if (m.target instanceof HTMLElement) watch(m.target.parentElement ?? document); continue; }
      m.addedNodes.forEach((n) => { if (n instanceof HTMLElement) watch(n.dataset.adId ? n.parentElement ?? n : n); });
    }
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-ad-id'] });

  document.addEventListener('click', (e) => {
    const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[rel~="sponsored"]');
    const ad = a?.closest<HTMLElement>('[data-ad-id]');
    if (ad && /^\d+$/.test(ad.dataset.adId ?? '')) { track('ad_click', `${ad.dataset.adId}:${ad.dataset.adSlot}`); flush(); }
  });
}
