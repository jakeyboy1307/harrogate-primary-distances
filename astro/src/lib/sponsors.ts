// Paid placements, drawn in the browser on the results, school panel, plan and area pages.
// The rule that keeps the checker trustworthy: a sponsor never changes a school's label, its place in the
// results, the sort order or the numbers. Sponsors sit in their own clearly labelled boxes.
//
// The ads come from /api/sponsors (astro/worker/index.js), which reads the admin database and only returns
// live ads inside their dates. The live site and previews have separate databases; the preview one holds
// made-up demo businesses (astro/db/seed-demo.sql).
import { esc } from './engine';

import type { Area, Placement } from './specs';
export type { Area, Placement } from './specs';
export { adAreasOf, areaOf } from './specs';
import { adAreasOf } from './specs';

export interface Sponsor {
  id: string;
  name: string;
  category: string;           // shown above the name, e.g. "School uniform"
  blurb: string;
  cta: string;                // button text
  url: string;                // where the button goes; utm tags are added so the sponsor can see the visits
  placements: Placement[];
  areas: Area[];
  urns?: number[];            // only these schools (uniform suppliers, school profiles)
  logo: string;               // two letters for the logo tile, used when there's no logo image
  logoUrl?: string;
  colour: string;
  offer?: string;             // a short line such as "10% off with code YSC10"
  openDays?: string[];        // school profiles
  start?: string;             // first day the ad shows, YYYY-MM-DD
  end?: string;               // last day the ad shows, YYYY-MM-DD
  demo?: boolean;             // a made-up business, tagged "Demo"
}

// Today as YYYY-MM-DD in UK time, to compare with start and end dates
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
export const isLive = (s: Pick<Sponsor, 'start' | 'end'>, day = today()) => (!s.start || s.start <= day) && (!s.end || s.end >= day);

// The ads running today, filled in by loadSponsors(). Empty until then, or if the request fails, so the
// pages always work without ads.
let SPONSORS: Sponsor[] = [];
let loading: Promise<Sponsor[]> | null = null;
export function loadSponsors() {
  loading ??= fetch('/api/sponsors')
    .then((r) => (r.ok ? r.json() : []))
    .then((list: Sponsor[]) => (SPONSORS = Array.isArray(list) ? list : []))
    .catch(() => (SPONSORS = []));
  return loading;
}

// The sponsors for a slot that are running today (checked here too, in case a page stays open past midnight).
// A school near York takes ads from its own area and York's (adAreasOf), so this takes one area or several.
export function sponsorsFor(p: Placement, area: Area | Area[], urn?: number) {
  const day = today(), want = Array.isArray(area) ? area : [area];
  return SPONSORS.filter((s) => s.placements.includes(p) && s.areas.some((a) => want.includes(a))
    && (!s.urns || (urn != null && s.urns.includes(urn))) && isLive(s, day));
}

// Add tags so the sponsor's own analytics show visits from here. No cookies or tracking on our side.
export function link(s: Sponsor, slot: Placement) {
  if (s.url.startsWith('#')) return s.url;
  let u: URL;
  try { u = new URL(s.url); } catch { return '#'; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return '#';
  u.searchParams.set('utm_source', 'yorkshireschoolchecker');
  u.searchParams.set('utm_medium', 'sponsored');
  u.searchParams.set('utm_campaign', slot);
  return u.href;
}

// The label every paid box carries. Advertising rules (the CAP Code) say ads must be obviously ads.
export const adLabel = (text = 'Sponsored', demo = false) =>
  `<span class="ad-label">${esc(text)}</span>${demo ? '<span class="ad-label ad-demo">Demo</span>' : ''}`;

// a logo image if there is one, otherwise a coloured tile with two letters
const colour = (c?: string) => (/^#[0-9a-f]{3,8}$/i.test(c ?? '') ? c : '#14182B');
const logo = (s: Sponsor) => s.logoUrl
  ? `<img class="ad-logo ad-logo-img" src="${esc(s.logoUrl)}" alt="" width="44" height="44" loading="lazy" />`
  : `<span class="ad-logo" style="background:${colour(s.colour)}" aria-hidden="true">${esc(s.logo)}</span>`;
const go = (s: Sponsor, slot: Placement, cls = 'btn btn-sm') =>
  `<a class="${cls}" href="${esc(link(s, slot))}" target="_blank" rel="sponsored noopener">${esc(s.cta)}</a>`;

// A sponsor card in the HTML the browser builds (results, panel, plan page)
export function adCard(s: Sponsor, slot: Placement, label = 'Sponsored') {
  return `<aside class="ad-card" aria-label="${esc(label)}: ${esc(s.name)}" data-ad-id="${esc(s.id)}" data-ad-slot="${slot}">
    <div class="ad-top">${adLabel(label, s.demo)}</div>
    <div class="ad-body">${logo(s)}<div><span class="ad-cat">${esc(s.category)}</span><h3 class="ad-name">${esc(s.name)}</h3>
      <p class="ad-blurb">${esc(s.blurb)}</p>${s.offer ? `<p class="ad-offer">${esc(s.offer)}</p>` : ''}</div></div>
    <div class="ad-foot">${go(s, slot)}</div>
  </aside>`;
}

// The school's own box in its panel: open days and a note. Paid for, so labelled.
export function profileBlock(s: Sponsor) {
  return `<section class="p-sec ad-profile" aria-label="Open days, from the school" data-ad-id="${esc(s.id)}" data-ad-slot="profile">
    <div class="p-sec-head"><h3>Open days</h3><span>${adLabel('Sponsored · From the school', s.demo)}</span></div>
    <p class="p-note" style="padding:0 0 12px">${esc(s.blurb)}</p>
    <ul class="ad-dates">${(s.openDays ?? []).map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
    <div style="margin-top:14px">${go(s, 'profile', 'btn btn-sm btn-dark')}</div>
  </section>`;
}

const turn = new Map<number, number>();

// The uniform supplier and one nearby service, under a school's details in its panel
export function panelSponsors(school: { urn: number; council: string; district?: string; name: string; ll?: [number, number] }) {
  const a = adAreasOf(school);
  // a supplier that holds this school's uniform contract comes before a general uniform shop
  const uni = sponsorsFor('uniform', a, school.urn).sort((x, y) => Number(!!y.urns) - Number(!!x.urns))[0];
  const near = sponsorsFor('nearby', a);
  // a random sponsor each time a page is opened, so they share the views evenly; it stays the same while
  // the page is open, so redrawing the panel doesn't swap it
  if (!turn.has(school.urn)) turn.set(school.urn, Math.floor(Math.random() * 1e6));
  const pick = near[turn.get(school.urn)! % (near.length || 1)];
  const cards = [uni && adCard(uni, 'uniform', 'Sponsored'), pick && adCard(pick, 'nearby', 'Sponsored')].filter(Boolean);
  return cards.length ? `<section class="p-sec ad-sec"><div class="p-sec-head"><h3>Getting ready</h3><span>Local businesses</span></div><div class="ad-stack">${cards.join('')}</div></section>` : '';
}
