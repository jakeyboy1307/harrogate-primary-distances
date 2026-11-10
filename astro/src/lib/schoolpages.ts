// Build-time facts for the school pages (/schools/<slug>/): the names parents actually search for, the page
// address, and the plain-English summaries of each school's figures. Names follow Google's suggestions
// (November 2026): parents type the short name plus "primary school", "catchment area", "Ofsted", "term dates",
// and the town when the name is shared with schools elsewhere (St Peter's, St Mary's...).
import { COUNCILS, firstsOk, fmt, haversine, MI, noDist, ofsted, whoGotIn, WHO_ELSE, type YearRec } from './engine';
import { loadAll, type AreaSchool } from './areas';
import { AREA_INFO, areaOf, type Area } from './specs';
// Every published school page's address, by URN. Once Google knows an address it mustn't change, so a school in
// here keeps its address even if the naming rules below would now give it another. New schools get one from the
// rules; after building, `npm run lock-slugs` adds them here (scripts/lock-slugs.mjs).
import LOCKED from './slugs.json';

export type Kind = 'primary school' | 'infant school' | 'junior school' | 'junior and infant school' | 'first school';

// Words parents leave out when they search: the faith, the legal status and the type of school
const DROP: RegExp[] = [
  /,.*$/,                                                    // ", Harrogate", ", A Voluntary Academy"
  /\s+-\s+.*$/,                                              // " - a Catholic voluntary academy"
  /\(.*?\)/g,                                               // "(VC)"
  /\b(Primary|Infant) (&|and) Nursery (School|Academy)\b/gi, // "Pickering Community Infant and Nursery School", "Braeburn Primary & Nursery Academy"
  /\bCP\b/g,                                                // "Helmsley CP School"
  /\bNursery (&|and) (?=Infants?\b)/gi,                      // "Filey CE Nursery & Infants Academy"
  /\bV[AC]\b/g,                                             // "Austwick CofE VA Primary School"
  /\bFoundation (?=School\b)/g,                            // "Wold Newton Foundation School"
  /\b(Church of England|C of E|Cof E|CofE|CE)\b/gi, /\b(Roman )?Catholic\b/gi, /\bMethodist\b/gi, /\bAnglican\b/gi,
  /\bVoluntary (Controlled|Aided)\b/gi, /\bControlled\b/gi, /\bCommunity\b/gi, /\bCounty\b/gi, /\band Nursery\b/gi,
  /\bVoluntary\s+(?=Academy\b)/gi,                           // "St Vincent's Voluntary Catholic Academy" (Catholic is gone by now)
  /\bJunior and Infants? School\b/gi,                         // "Colden Junior and Infant School" (after SPELL below)
  /\bFirst School\b/gi,                                       // "Shepley First School", Reception to Year 5 (Kirklees)
  /\b(Primary|Infant|Infants|Junior) (Foundation )?(School|Academy)\b/gi, /\bSchool\b/gi, /\bAcademy\b/gi,
  /\s+Primary\s*$/i,                                         // "Westfield Primary Community School"
];
// Register names written in shorthand, put the way parents say them before the rules above run (Calderdale's
// "Todmorden CofE J, I & N School", "Elland CE Junior, Infant and Nursery School", "St John's Primary School In
// Rishworth", "St Michael and All Angels CofE Primary & Pre School"). No school published before them had these forms
const SPELL: [RegExp, string][] = [
  [/\bJ,?\s*I,?\s*(&|and)\s*N\b/g, 'Junior and Infant'], [/\bJ\s*(&|and)\s*I\b/g, 'Junior and Infant'],
  [/\bJunior,?\s+(?=Infant\b)/g, 'Junior and '], [/\bJunior\s*&\s*(?=Infant\b)/g, 'Junior and '], [/\s+and Early Years\b/g, ''],
  [/\bJunior and Infants? (&|and) Nursery\b/gi, 'Junior and Infant'], [/\bPrimary and Foundation Stage School\b/, 'Primary School'],
  [/\bFirst (&|and) Nursery School\b/, 'First School'], [/\bPrimary (School )?(&|and) Nursery$/, 'Primary School'], [/(?<!Voluntary )\bAided (?=Primary\b)/, ''], [/\s*(&|and)\s+Pre[- ]School\b/gi, ''], [/\bSchool In ([A-Z]\w+)$/, 'School, $1'],
];
const spell = (name: string) => SPELL.reduce((n, [r, w]) => n.replace(r, w), name);
// names so common that the town has to go with them
const GENERIC = /^(St|Saint|All Saints|Holy|Our Lady|Christ|Sacred|Riverside)\b/i;

export const kindOf = (name: string): Kind => {
  const n = spell(name);
  return /\bFirst School\b/i.test(n) ? 'first school' : /\bJunior and Infants?\b/i.test(n) ? 'junior and infant school'
    : /\bInfants?\b/i.test(n) ? 'infant school' : /\bJunior\b/i.test(n) ? 'junior school' : 'primary school';
};
export function shortOf(name: string) {
  let s = spell(name);
  for (const r of DROP) s = s.replace(r, ' ');
  return s.replace(/\s+/g, ' ').trim();
}
const title = (k: Kind) => k.replace(/\b(?!and\b)\w/g, (c) => c.toUpperCase());   // "Junior and Infant School"
// "Alanbrooke Academy", "Knayton CofE Academy": no primary, infant or junior in the name, so it stays an Academy
// ... and "Barkerend Primary Leadership Academy" (Star Academies' name for its schools) is an academy by name too
const isAcademy = (name: string) => /\bAcademy\b/i.test(name) && (!/\b(Primary|Infants?|Junior)\b/i.test(name) || /\bPrimary Leadership Academy\b/i.test(name));
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
  const all = loadAll();
  // names that differ only by an apostrophe are the same name ("Lady Elizabeth Hastings'", Thorp Arch and Ledston)
  const shorts = all.map((s) => `${shortOf(s.name).replace(/['’]/g, '')}|${kindOf(s.name)}`);
  const pages = all.map((s, i) => {
    const kind = kindOf(s.name);
    // "Batley Grammar School" takes Reception too: a grammar school keeps its own name
    const label = isAcademy(s.name) ? 'Academy' : /\bGrammar School\b/.test(s.name) ? 'School' : title(kind);
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
    // a published page keeps its name too: one that went out without its town ("Westfield Primary School" in York)
    // doesn't gain one when a school of the same name joins elsewhere (Westfield, Cottingham)
    if (keep && p.withPlace && !GENERIC.test(p.short) && !keep.endsWith(kebab(p.s.place))) {
      p.withPlace = false;
      p.name = p.name.replace(/, [^,]+$/, '');
    }
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
    if (y.g === 'near') return `In ${y.y}, after brothers and sisters, places went to the children who lived nearest: the furthest child offered one lived ${d} away.`;
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
  if (y.s === 'firsts') return (firstsOk(y)
    ? `In ${y.y}, everyone who put it as their first choice got a place (${y.f} families did).`
    : `In ${y.y}, ${y.f} families put it first and ${y.fo} of them got a place. The national figures don’t say who got the last place.`)
    + (y.n ? ` ${y.n.charAt(0).toUpperCase()}${y.n.slice(1)}.` : '');   // Hull: how the places went, from the council's guide
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
  const firstsIn = s.d.filter(firstsOk).length;   // DfE-only years where everyone who put it first got in
  return { latest, perPlace, trend, furthest, closest, allIn, firstsIn, of: ofsted(s.of), council: COUNCILS[s.council] ?? COUNCILS['North Yorkshire'] };
}

export const miles = (m?: number | null) => (m == null ? '' : fmt(m).replace(' mi', ' miles'));

// The nearest other schools, for "other schools near" and the internal links between pages
export function nearby(p: SchoolPage, n = 6) {
  return schoolPages().filter((q) => q.s.urn !== p.s.urn)
    .map((q) => ({ q, m: haversine(p.s.ll, q.s.ll) }))
    .sort((a, b) => a.m - b.m).slice(0, n)
    .map(({ q, m }) => ({ ...q, miles: (m / MI).toFixed(1) }));
}
