// Counts for the admin dashboard: page views, searches by area, school panels opened, and ad views and clicks.
// They're sent to /api/hit (astro/worker/index.js) as daily totals. No cookies, no ID, nothing that identifies
// anyone, and nothing is stored in the browser.

type Kind = 'page' | 'search' | 'panel' | 'ad_view' | 'ad_click';
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

let started = false;
// Watch for ads on the page: count a view once an ad is at least half on screen (once per ad per page view),
// and a click on its button or link. Ads carry data-ad-id and data-ad-slot (src/lib/sponsors.ts).
export function startTracking(page: string) {
  if (started) return;
  started = true;
  track('page', page);
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
