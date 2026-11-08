// Paid placements. Shared by the build (area pages) and the browser (results, school panel, plan page).
// The rule that keeps the checker trustworthy: a sponsor never changes a school's label, its place in the
// results, the sort order or the numbers. Sponsors sit in their own clearly labelled boxes.
//
// Real sponsors are listed in REAL below. The demo businesses (sponsors-demo.ts) only appear on preview
// and local builds.
import { esc } from './engine';
import { DEMO_SPONSORS } from './sponsors-demo';

export type Area = 'harrogate' | 'york';
export type Placement =
  | 'uniform'     // school panel: the uniform supplier for that school
  | 'profile'     // school panel: open days and a note, supplied by the school itself
  | 'nearby'      // school panel: one family service near the school
  | 'results'     // results list: one featured card among the schools
  | 'plan'        // plan page: "Get ready for September" partners
  | 'area';       // area pages: the page sponsor and the local services directory

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
  logo: string;               // two letters for the demo logo tile
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

// Real sponsors go here. Each needs start and end dates (YYYY-MM-DD, both days included): the ad switches
// itself off after the end date, and before the start date, with no code change needed.
const REAL: Sponsor[] = [];

export const SPONSORS: Sponsor[] = [...REAL, ...(__DEMO_SPONSORS__ ? DEMO_SPONSORS : [])];

// Harrogate district schools are "harrogate"; York and the North Yorkshire villages round it are "york"
export const areaOf = (s: { council: string; district?: string }): Area =>
  s.council === 'North Yorkshire' && s.district === 'Harrogate' ? 'harrogate' : 'york';

// The sponsors for a slot that are running today. Pass day = null to skip the date check (the area pages,
// which are built ahead of time and check the dates in the browser instead).
export function sponsorsFor(p: Placement, area: Area, urn?: number, day: string | null = today()) {
  return SPONSORS.filter((s) => s.placements.includes(p) && s.areas.includes(area)
    && (!s.urns || (urn != null && s.urns.includes(urn))) && (day == null || isLive(s, day)));
}

// Add tags so the sponsor's own analytics show visits from here. No cookies or tracking on our side.
export function link(s: Sponsor, slot: Placement) {
  if (s.url.startsWith('#')) return s.url;
  const u = new URL(s.url);
  u.searchParams.set('utm_source', 'yorkshireschoolchecker');
  u.searchParams.set('utm_medium', 'sponsored');
  u.searchParams.set('utm_campaign', slot);
  return u.href;
}

// The label every paid box carries. Advertising rules (the CAP Code) say ads must be obviously ads.
export const adLabel = (text = 'Sponsored', demo = false) =>
  `<span class="ad-label">${esc(text)}</span>${demo ? '<span class="ad-label ad-demo">Demo</span>' : ''}`;

// Dates on the element, so pages built ahead of time can hide an ad in the browser once it has ended
export const dateAttrs = (s: Sponsor) => `${s.start ? ` data-ad-start="${esc(s.start)}"` : ''}${s.end ? ` data-ad-end="${esc(s.end)}"` : ''}`;

const logo = (s: Sponsor) => `<span class="ad-logo" style="background:${s.colour}" aria-hidden="true">${esc(s.logo)}</span>`;
const go = (s: Sponsor, slot: Placement, cls = 'btn btn-sm') =>
  `<a class="${cls}" href="${esc(link(s, slot))}" target="_blank" rel="sponsored noopener">${esc(s.cta)}</a>`;

// A sponsor card in the HTML the browser builds (results, panel, plan page)
export function adCard(s: Sponsor, slot: Placement, label = 'Sponsored') {
  return `<aside class="ad-card" aria-label="${esc(label)}: ${esc(s.name)}"${dateAttrs(s)}>
    <div class="ad-top">${adLabel(label, s.demo)}</div>
    <div class="ad-body">${logo(s)}<div><span class="ad-cat">${esc(s.category)}</span><h3 class="ad-name">${esc(s.name)}</h3>
      <p class="ad-blurb">${esc(s.blurb)}</p>${s.offer ? `<p class="ad-offer">${esc(s.offer)}</p>` : ''}</div></div>
    <div class="ad-foot">${go(s, slot)}</div>
  </aside>`;
}

// The school's own box in its panel: open days and a note. Paid for, so labelled.
export function profileBlock(s: Sponsor) {
  return `<section class="p-sec ad-profile" aria-label="Open days, from the school">
    <div class="p-sec-head"><h3>Open days</h3><span>${adLabel('Sponsored · From the school', s.demo)}</span></div>
    <p class="p-note" style="padding:0 0 12px">${esc(s.blurb)}</p>
    <ul class="ad-dates">${(s.openDays ?? []).map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
    <div style="margin-top:14px">${go(s, 'profile', 'btn btn-sm btn-dark')}</div>
  </section>`;
}

const turn = new Map<number, number>();

// The uniform supplier and one nearby service, under a school's details in its panel
export function panelSponsors(school: { urn: number; council: string; district?: string; name: string }) {
  const a = areaOf(school);
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
