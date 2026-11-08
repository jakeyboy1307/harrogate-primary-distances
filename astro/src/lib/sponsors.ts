// Paid placements. Shared by the build (area pages) and the browser (results, school panel, plan page).
// The rule that keeps the checker trustworthy: a sponsor never changes a school's label, its place in the
// results, the sort order or the numbers. Sponsors sit in their own clearly labelled boxes.
//
// Everything below is DEMO data for designing the slots: made-up businesses with no real links.
// Swap in real sponsors (or load them from a JSON file) before this goes live, and set DEMO to false.
import { esc } from './engine';

export const DEMO = true;

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
}

export const SPONSORS: Sponsor[] = [
  // School uniform: the obvious fit. Suppliers hold contracts for named schools, so show them only on those schools.
  { id: 'uni-hg', name: 'Spa Town Schoolwear', category: 'School uniform', logo: 'ST', colour: '#2747D8',
    blurb: 'Stocks the logo jumpers, book bags and PE kit for this school. Order online or try on in store.',
    cta: 'Shop uniform', url: '#demo', offer: '10% off your first order with code YSC10',
    placements: ['uniform', 'plan', 'area'], areas: ['harrogate'] },
  { id: 'uni-yk', name: 'Minster Uniforms', category: 'School uniform', logo: 'MU', colour: '#7A3FB8',
    blurb: 'Badged uniform for this school, with a fitting service on Saturdays.',
    cta: 'Shop uniform', url: '#demo', offer: 'Free name labels with every order',
    placements: ['uniform', 'plan', 'area'], areas: ['york'] },

  // Independent schools buy attention while parents are comparing: one featured card in the results.
  { id: 'ind-hg', name: 'Harlow Hill Prep', category: 'Independent school', logo: 'HP', colour: '#1D6B36',
    blurb: 'Co-ed prep for ages 3 to 13. Small classes, wraparound care until 6pm, and a minibus from Knaresborough.',
    cta: 'Book an open morning', url: '#demo', offer: 'Open mornings every Friday this term',
    placements: ['results', 'area'], areas: ['harrogate'] },
  { id: 'ind-yk', name: 'Ouse Bank School', category: 'Independent school', logo: 'OB', colour: '#1D6B36',
    blurb: 'Independent primary in York for ages 4 to 11, with forest school and specialist music from Reception.',
    cta: 'Book a visit', url: '#demo',
    placements: ['results', 'area'], areas: ['york'] },

  // Family services: wraparound care, clubs, tutors, shoes, and the house move into a catchment.
  { id: 'care-hg', name: 'Busy Bees Breakfast Club', category: 'Wraparound care', logo: 'BB', colour: '#C8382C',
    blurb: 'Breakfast and after-school club with a walking pick-up from six Harrogate primaries.',
    cta: 'Check for a space', url: '#demo',
    placements: ['nearby', 'plan', 'area'], areas: ['harrogate'] },
  { id: 'care-yk', name: 'Riverside Kids Club', category: 'Wraparound care', logo: 'RK', colour: '#C8382C',
    blurb: 'Before and after school care and holiday clubs across York, with pick-ups from local primaries.',
    cta: 'Check for a space', url: '#demo',
    placements: ['nearby', 'plan', 'area'], areas: ['york'] },
  { id: 'shoe', name: 'Little Steps Shoes', category: 'School shoes', logo: 'LS', colour: '#8A5300',
    blurb: 'Fitted school shoes for small feet, in Harrogate and York. Book a fitting before the September rush.',
    cta: 'Book a fitting', url: '#demo',
    placements: ['plan', 'area'], areas: ['harrogate', 'york'] },
  { id: 'move-hg', name: 'Nidd Valley Homes', category: 'Moving house', logo: 'NV', colour: '#14182B',
    blurb: 'Thinking of moving into a catchment? See homes for sale near the schools you like.',
    cta: 'See homes for sale', url: '#demo',
    placements: ['nearby', 'plan', 'area'], areas: ['harrogate'] },
  { id: 'move-yk', name: 'Walls & Bar Estates', category: 'Moving house', logo: 'WB', colour: '#14182B',
    blurb: 'Local estate agent covering York and the villages. Free valuation if you’re moving for a school.',
    cta: 'See homes for sale', url: '#demo',
    placements: ['nearby', 'plan', 'area'], areas: ['york'] },
  { id: 'tutor', name: 'First Words Tutoring', category: 'Tutoring', logo: 'FW', colour: '#2747D8',
    blurb: 'Phonics and reading support for Reception and Year 1, at home or online.',
    cta: 'Find a tutor', url: '#demo',
    placements: ['plan', 'area'], areas: ['harrogate', 'york'] },

  // School profiles: a school (often an academy trust) pays to add open days and a welcome note to its own panel.
  { id: 'prof-western', name: 'Western Primary School', category: 'From the school', logo: 'WP', colour: '#2747D8',
    blurb: 'We’d love to show you round. Tours are led by our Year 6 pupils and last about 45 minutes.',
    cta: 'Book a tour', url: '#demo', openDays: ['Tue 18 November, 9:30am', 'Thu 4 December, 1:30pm', 'Wed 7 January, 9:30am'],
    placements: ['profile'], areas: ['harrogate'], urns: [142220] },
  { id: 'prof-scarcroft', name: 'Scarcroft Primary School', category: 'From the school', logo: 'SP', colour: '#2747D8',
    blurb: 'Come and see us in action. Bring your child, and meet our Reception team.',
    cta: 'Book a tour', url: '#demo', openDays: ['Wed 19 November, 10am', 'Sat 29 November, 10am'],
    placements: ['profile'], areas: ['york'], urns: [142637] },
];

// Harrogate district schools are "harrogate"; York and the North Yorkshire villages round it are "york"
export const areaOf = (s: { council: string; district?: string }): Area =>
  s.council === 'North Yorkshire' && s.district === 'Harrogate' ? 'harrogate' : 'york';

export function sponsorsFor(p: Placement, area: Area, urn?: number) {
  return SPONSORS.filter((s) => s.placements.includes(p) && s.areas.includes(area) && (!s.urns || (urn != null && s.urns.includes(urn))));
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
export const adLabel = (text = 'Sponsored') =>
  `<span class="ad-label">${esc(text)}</span>${DEMO ? '<span class="ad-label ad-demo">Demo</span>' : ''}`;

const logo = (s: Sponsor) => `<span class="ad-logo" style="background:${s.colour}" aria-hidden="true">${esc(s.logo)}</span>`;
const go = (s: Sponsor, slot: Placement, cls = 'btn btn-sm') =>
  `<a class="${cls}" href="${esc(link(s, slot))}" target="_blank" rel="sponsored noopener">${esc(s.cta)}</a>`;

// A sponsor card in the HTML the browser builds (results, panel, plan page)
export function adCard(s: Sponsor, slot: Placement, label = 'Sponsored') {
  return `<aside class="ad-card" aria-label="${esc(label)}: ${esc(s.name)}">
    <div class="ad-top">${adLabel(label)}</div>
    <div class="ad-body">${logo(s)}<div><span class="ad-cat">${esc(s.category)}</span><h3 class="ad-name">${esc(s.name)}</h3>
      <p class="ad-blurb">${esc(s.blurb)}</p>${s.offer ? `<p class="ad-offer">${esc(s.offer)}</p>` : ''}</div></div>
    <div class="ad-foot">${go(s, slot)}</div>
  </aside>`;
}

// The school's own box in its panel: open days and a note. Paid for, so labelled.
export function profileBlock(s: Sponsor) {
  return `<section class="p-sec ad-profile" aria-label="Open days, from the school">
    <div class="p-sec-head"><h3>Open days</h3><span>${adLabel('From the school')}</span></div>
    <p class="p-note" style="padding:0 0 12px">${esc(s.blurb)}</p>
    <ul class="ad-dates">${(s.openDays ?? []).map((d) => `<li>${esc(d)}</li>`).join('')}</ul>
    <div style="margin-top:14px">${go(s, 'profile', 'btn btn-sm btn-dark')}</div>
  </section>`;
}

// The uniform supplier and one nearby service, under a school's details in its panel
export function panelSponsors(school: { urn: number; council: string; district?: string; name: string }) {
  const a = areaOf(school);
  const uni = sponsorsFor('uniform', a, school.urn)[0] ?? sponsorsFor('uniform', a)[0];
  const near = sponsorsFor('nearby', a);
  const pick = near[school.urn % (near.length || 1)];   // the same one each time for a given school
  const cards = [uni && adCard(uni, 'uniform', 'Sponsored'), pick && adCard(pick, 'nearby', 'Sponsored')].filter(Boolean);
  return cards.length ? `<section class="p-sec ad-sec"><div class="p-sec-head"><h3>Getting ready</h3><span>Local businesses</span></div><div class="ad-stack">${cards.join('')}</div></section>` : '';
}
