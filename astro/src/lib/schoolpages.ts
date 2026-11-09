// Build-time facts for the school pages (/schools/<slug>/): the names parents actually search for, the page
// address, and the plain-English summaries of each school's figures. Names follow Google's suggestions
// (November 2026): parents type the short name plus "primary school", "catchment area", "Ofsted", "term dates",
// and the town when the name is shared with schools elsewhere (St Peter's, St Mary's...).
import { COUNCILS, fmt, haversine, MI, noDist, ofsted, whoGotIn, WHO_ELSE, type YearRec } from './engine';
import { loadArea, type AreaSchool } from './areas';
import { AREA_INFO, areaOf, type Area } from './specs';
// Every published school page's address, by URN. Once Google knows an address it mustn't change, so a school in
// here keeps its address even if the naming rules below would now give it another. New schools get one from the
// rules; after building, `npm run lock-slugs` adds them here (scripts/lock-slugs.mjs).
import LOCKED from './slugs.json';

export type Kind = 'primary school' | 'infant school' | 'junior school';

// Words parents leave out when they search: the faith, the legal status and the type of school
const DROP: RegExp[] = [
  /,.*$/,                                                    // ", Harrogate", ", A Voluntary Academy"
  /\s+-\s+.*$/,                                              // " - a Catholic voluntary academy"
  /\(.*?\)/g,                                               // "(VC)"
  /\b(Primary|Infant) (&|and) Nursery (School|Academy)\b/gi, // "Pickering Community Infant and Nursery School", "Braeburn Primary & Nursery Academy"
  /\bCP\b/g,                                                // "Helmsley CP School"
  /\bNursery (&|and) (?=Infants?\b)/gi,                      // "Filey CE Nursery & Infants Academy"
  /\bV[AC]\b/g,                                             // "Austwick CofE VA Primary School"
  /\b(Church of England|C of E|Cof E|CofE|CE)\b/gi, /\b(Roman )?Catholic\b/gi, /\bMethodist\b/gi, /\bAnglican\b/gi,
  /\bVoluntary (Controlled|Aided)\b/gi, /\bControlled\b/gi, /\bCommunity\b/gi, /\bCounty\b/gi, /\band Nursery\b/gi,
  /\b(Primary|Infant|Infants|Junior) (Foundation )?(School|Academy)\b/gi, /\bSchool\b/gi, /\bAcademy\b/gi,
  /\s+Primary\s*$/i,                                         // "Westfield Primary Community School"
];
// names so common that the town has to go with them
const GENERIC = /^(St|Saint|All Saints|Holy|Our Lady|Christ|Sacred|Riverside)\b/i;

export const kindOf = (name: string): Kind => (/\bInfants?\b/i.test(name) ? 'infant school' : /\bJunior\b/i.test(name) ? 'junior school' : 'primary school');
export function shortOf(name: string) {
  let s = name;
  for (const r of DROP) s = s.replace(r, ' ');
  return s.replace(/\s+/g, ' ').trim();
}
const title = (k: Kind) => k.replace(/\b\w/g, (c) => c.toUpperCase());
// "Alanbrooke Academy", "Knayton CofE Academy": no primary, infant or junior in the name, so it stays an Academy
const isAcademy = (name: string) => /\bAcademy\b/i.test(name) && !/\b(Primary|Infants?|Junior)\b/i.test(name);
const kebab = (s: string) => s.toLowerCase().replace(/[’']/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export interface SchoolPage {
  s: AreaSchool;
  slug: string;
  short: string;          // "Admiral Long"
  kind: Kind;             // "primary school"
  name: string;           // "Admiral Long Primary School" (with ", Harrogate" when the name is shared)
  withPlace: boolean;
  area: Area;
  areaName: string;       // "Harrogate", "York", "Northallerton"... (lib/specs.ts AREA_INFO)
  areaPage: string;       // the area page's address
}

let cache: SchoolPage[] | null = null;
export function schoolPages(): SchoolPage[] {
  if (cache) return cache;
  const all = [...loadArea('north-yorkshire.json'), ...loadArea('york.json')];
  const shorts = all.map((s) => `${shortOf(s.name)}|${kindOf(s.name)}`);
  const pages = all.map((s, i) => {
    const kind = kindOf(s.name);
    const label = isAcademy(s.name) ? 'Academy' : title(kind);
    // "Trinity Academy Richmond": the word Academy sits inside the name, so it stays there, in the short name too
    const [before, after = ''] = s.name.replace(/,.*$/, '').split(/\bAcademy\b/);
    const inside = label === 'Academy' && !!shortOf(after);
    const short = inside ? `${shortOf(before)} Academy ${shortOf(after)}` : shortOf(s.name);
    const base = inside ? short : `${short} ${label}`;
    const withPlace = GENERIC.test(shortOf(s.name)) || shorts.filter((x) => x === shorts[i]).length > 1;
    const area = areaOf(s);
    return {
      s, short, kind, withPlace, area,
      name: withPlace && s.place && !short.includes(s.place) ? `${base}, ${s.place}` : base,
      slug: kebab(withPlace && !short.includes(s.place) ? `${base} ${s.place}` : base),
      areaName: AREA_INFO[area].short,
      areaPage: AREA_INFO[area].page,
    };
  });
  const locked = LOCKED as Record<string, string>, taken = new Set(Object.values(locked));
  for (const p of pages) {
    const keep = locked[p.s.urn];
    if (keep) p.slug = keep;
    else if (taken.has(p.slug)) p.slug = `${p.slug}-${p.s.urn}`;   // a published page already has this address
  }
  // any address still shared gets the school's URN on the end
  for (const p of pages) if (!locked[p.s.urn] && pages.filter((q) => q.slug === p.slug).length > 1) p.slug = `${p.slug}-${p.s.urn}`;
  const fresh = pages.filter((p) => !locked[p.s.urn]);
  if (fresh.length) console.log(`  ${fresh.length} school pages aren't in src/lib/slugs.json yet; run npm run lock-slugs after this build`);
  return (cache = pages);
}

export const pageOf = (urn: number) => schoolPages().find((p) => p.s.urn === urn);

// ---------- plain-English summaries ----------
export const published = (s: AreaSchool) => s.d.filter((y) => y.s !== 'not_published');

// One full sentence for a year, for the page text (the results list uses the shorter whoGotIn)
export function yearLine(y: YearRec) {
  const d = miles(y.m);
  if (y.s === 'distance') {
    if (y.g === 'out') return `In ${y.y}, everyone in the catchment got a place, and so did children from outside it who lived within ${d}.`;
    if (y.g === 'in') return `In ${y.y}, only children in the catchment got a place, and the last one went to a child ${d} away.`;
    if (y.g === 'sib' || y.g === 'staff') return `In ${y.y}, everyone in the catchment got a place, plus ${WHO_ELSE[y.g]}, but no other children from outside it.`;
    return `In ${y.y}, places went by the school’s own rules, and the last one went to a child ${d} away.`;
  }
  if (y.s === 'catchment') {
    const got = y.xa! - y.xr!;
    if (y.ir) return `In ${y.y}, not everyone in the catchment got a place: ${y.ia! - y.ir} of ${y.ia} did.`;
    if (!y.ia) return `In ${y.y}, ${got} of ${y.xa} children who applied got a place.`;
    return got ? `In ${y.y}, everyone in the catchment got a place, plus ${got} of the ${y.xa} children who applied from outside it.`
      : `In ${y.y}, only children in the catchment got a place.`;
  }
  if (y.s === 'all_offered') return `In ${y.y}, everyone who applied got a place.`;
  return `The council didn’t publish who got a place in ${y.y}.`;
}

export function summary(p: SchoolPage) {
  const s = p.s, latest = published(s)[0];
  const first = s.d[s.d.length - 1], last = s.d[0];
  const perPlace = latest?.a && latest?.p ? latest.a / latest.p : null;
  const trend = first?.a && last?.a && first !== last
    ? last.a > first.a * 1.1 ? `Applications rose from ${first.a} in ${first.y} to ${last.a} in ${last.y}.`
      : last.a < first.a * 0.9 ? `Applications fell from ${first.a} in ${first.y} to ${last.a} in ${last.y}.`
      : `Applications have stayed around ${Math.round((first.a + last.a) / 2)} a year.`
    : '';
  // the furthest the last place went, over the years with a distance
  const dists = s.d.filter((y) => y.s === 'distance' && !noDist(y) && y.m != null);
  const furthest = dists.length ? dists.reduce((a, b) => (b.m! > a.m! ? b : a)) : null;
  const closest = dists.length ? dists.reduce((a, b) => (b.m! < a.m! ? b : a)) : null;
  const allIn = s.d.filter((y) => y.s === 'all_offered').length;
  return { latest, perPlace, trend, furthest, closest, allIn, of: ofsted(s.of), council: COUNCILS[s.council] ?? COUNCILS['North Yorkshire'] };
}

export const miles = (m?: number | null) => (m == null ? '' : fmt(m).replace(' mi', ' miles'));

// The nearest other schools, for "other schools near" and the internal links between pages
export function nearby(p: SchoolPage, n = 6) {
  return schoolPages().filter((q) => q.s.urn !== p.s.urn)
    .map((q) => ({ q, m: haversine(p.s.ll, q.s.ll) }))
    .sort((a, b) => a.m - b.m).slice(0, n)
    .map(({ q, m }) => ({ ...q, miles: (m / MI).toFixed(1) }));
}
