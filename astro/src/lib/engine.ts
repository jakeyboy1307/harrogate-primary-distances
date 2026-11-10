// The admissions logic, ported from the live checker (build/template.html) so results match it exactly.

export const MI = 1609.344;
export const EDGE_M = 0.1 * MI;     // borderline band: a tenth of a mile
export const UNDERSUB_M = 2 * MI;   // an out-of-catchment cut-off this long means nobody local missed out
export const MAX_SHORT = 5;         // the most choices any council's form takes; each council's own is COUNCILS[...].prefs
export const NUM = ['none', 'one', 'two', 'three', 'four', 'five'];
export const ROUTER = 'https://routing.openstreetmap.de/routed-foot/table/v1/foot/';
// Each council's own catchment map and Reception application page, by the district postcodes.io gives a postcode
// prefs: schools the form takes. mapData false: the council doesn't publish its catchments as map data (Hull,
// Middlesbrough, Redcar and Cleveland), so the checker can't tell anyone which catchment they're in. mapNote says what
// it does publish ("publishes its catchments only as a printed map"), mapTip how to find out instead, with {map} for
// the link to catchMap. noCatch: the council's primary schools have no catchments (Calderdale); what to say instead
export interface Council {
  name: string; catchMap: string; apply: string; policy: string; prefs: number;
  mapData?: false; mapNote?: string; mapTip?: string; noCatch?: string;
}
export const COUNCILS: Record<string, Council> = {
  'North Yorkshire': {
    name: 'North Yorkshire Council',
    catchMap: 'https://experience.arcgis.com/experience/4dd5b97eae514b31a067137ebf7cdd6a',
    apply: 'https://www.northyorks.gov.uk/education-and-learning/education-and-learning/school-admissions/starting-primary-school-and-junior-school',
    policy: 'catchment first, then brothers and sisters, then distance',
    prefs: 5,
  },
  'East Riding of Yorkshire': {
    name: 'East Riding of Yorkshire Council',
    catchMap: 'https://eastriding.maps.arcgis.com/apps/webappviewer/index.html?id=244a8443912c427e9bef37461ee1942e',
    apply: 'https://www.eastriding.gov.uk/learning/schools-colleges-and-academies/school-admissions/apply-for-a-school-place/how-to-apply-for-a-school-place/',
    policy: 'catchment first, then brothers and sisters, then distance in a straight line',
    prefs: 3,
  },
  'Kingston upon Hull, City of': {
    name: 'Hull City Council',
    catchMap: 'https://www.hull.gov.uk/downloads/file/4889/primary-school-catchment-map',
    apply: 'https://www.hull.gov.uk/applications-transfers/primary-school-applications',
    policy: 'each academy’s own rules, most often catchment first, then brothers and sisters, then the shortest walk',
    prefs: 3,
    mapData: false,
    mapNote: 'publishes its catchments only as a printed map',
    mapTip: 'Find your address on {map:the council’s catchment map}',
  },
  Middlesbrough: {
    name: 'Middlesbrough Council',
    catchMap: 'https://www.middlesbrough.gov.uk/schools-and-education/school-admissions/school-admission-zones/',
    apply: 'https://www.middlesbrough.gov.uk/schools-and-education/school-admissions/',
    policy: 'children in care, then the admission zone, then brothers and sisters, then distance in a straight line',
    prefs: 3,
    mapData: false,
    mapNote: 'publishes its admission zones only as a PDF map',
    mapTip: 'Find your address on {map:the council’s admission zones map}. Every home is in two zones, one for a church school and one not',
  },
  'Redcar and Cleveland': {
    name: 'Redcar and Cleveland Council',
    catchMap: 'https://www.redcar-cleveland.gov.uk/schools-and-education/school-admissions/starting-primary-education',
    apply: 'https://www.redcar-cleveland.gov.uk/schools-and-education/school-admissions/apply-for-school-places-online',
    policy: 'each academy’s own rules, most often the admission zone first, then brothers and sisters, then distance in a straight line',
    prefs: 3,
    mapData: false,
    mapNote: 'doesn’t publish maps of its admission zones',
    mapTip: 'Ask the school which zone you’re in, or see {map:the council’s guide to starting primary school}',
  },
  Calderdale: {
    name: 'Calderdale Council',
    catchMap: 'https://new.calderdale.gov.uk/schools-and-learning/schools/admissions/process/community-voluntary-primary-2026',
    apply: 'https://new.calderdale.gov.uk/schools-and-learning/schools/admissions/process/primary',
    policy: 'children in care, then brothers and sisters, then the children who live nearest, in a straight line',
    prefs: 5,
    mapData: false,
    mapNote: 'doesn’t publish a map of it',
    mapTip: 'Ask the school, or see {map:Calderdale Council’s admissions rules}',
    noCatch: 'Calderdale’s primary schools don’t have catchment areas. After children in care and brothers and sisters, places go to the children who live nearest',
  },
  Kirklees: {
    name: 'Kirklees Council',
    catchMap: 'https://mapping.kirklees.gov.uk/connect/analyst/mobile/#/main?mapcfg=Priority%20Admission%20Areas%20(Public)',
    apply: 'https://www.kirklees.gov.uk/beta/admissions/apply-primary-school-place.aspx',
    policy: 'children in care, then children in the catchment with a brother or sister at the school, then the rest of the catchment, then brothers and sisters from outside it, then distance in a straight line',
    prefs: 3,
  },
  Leeds: {
    name: 'Leeds City Council',
    catchMap: 'https://www.leeds.gov.uk/schools-and-education/school-admissions/check-school-details',
    apply: 'https://www.leeds.gov.uk/schools-and-education/school-admissions/apply-for-a-primary-school',
    policy: 'children in care, then brothers and sisters, then children in the catchment, then everyone else, nearest first in a straight line',
    prefs: 5,
  },
  Bradford: {
    name: 'Bradford Council',
    catchMap: 'https://bso.bradford.gov.uk/content/admissions/priority-areas',
    apply: 'https://www.bradford.gov.uk/education-and-skills/school-admissions/apply-for-a-place-at-one-of-bradford-districts-schools/',
    policy: 'children in care, then brothers and sisters, then the children who live nearest, in a straight line',
    prefs: 5,
    // most schools have no catchment; thirteen have a priority area, twelve mapped (St Joseph's, Bingley's is a picture)
    mapNote: 'publishes it only as a picture',
    mapTip: 'See {map:the council’s priority area maps}',
    noCatch: 'Most of Bradford’s primary schools don’t have catchment areas. After children in care and brothers and sisters, places go to the children who live nearest',
  },
  York: {
    name: 'City of York Council',
    catchMap: 'https://www.york.gov.uk/schools/PrimaryMap',
    apply: 'https://www.york.gov.uk/PrimaryAdmissions',
    policy: 'catchment first, brothers and sisters ahead of others, then brothers and sisters from outside it, then the shortest walk',
    prefs: 5,
  },
};
// "Places go …" with a council's policy: "catchment first, …", "to children in care, …", "by each academy's own rules"
export const placesGo = (c: Council) => `Places go ${/^children\b/.test(c.policy) ? 'to ' : /^each\b/.test(c.policy) ? 'by ' : ''}${c.policy}`;
// A council's tip on finding your catchment, with its link filled in (councils without map data)
export const mapTipHtml = (c: Council) => (c.mapTip ?? 'Find your address on {map:the council’s catchment map}')
  .replace(/\{map:([^}]*)\}/, (_, t) => `<a href="${c.catchMap}" target="_blank" rel="noopener">${t}</a>`);
export const council = (district?: string | null) => COUNCILS[district ?? ''] ?? COUNCILS['North Yorkshire'];

export type LatLng = [number, number];
export type V = 'in' | 'all' | 'edge' | 'out' | 'na';

export interface YearRec {
  y: number;
  // distance: how far the last place went (North Yorkshire). catchment: how many applicants from inside (ia) and
  // outside (xa) the catchment were turned away (ir, xr), where a council publishes no distances (York).
  // firsts: only the DfE's national figures, how many put the school first (f) and how many of them got it (fo),
  // where a council publishes nothing on who got the last place (Hull, and East Riding's earlier years).
  s: 'distance' | 'catchment' | 'all_offered' | 'not_published' | 'firsts';
  m?: number;
  g?: 'in' | 'out' | 'sib' | 'staff' | 'crit' | 'near';   // near: no catchment, brothers and sisters then distance (Calderdale)
  crit?: string;
  a?: number; o?: number; p?: number; f?: number; fo?: number;
  ia?: number; ir?: number; xa?: number; xr?: number;
  n?: string;
}
export interface Ofsted {
  kind: 'card' | 'grade' | 'areas' | 'ungraded' | 'none';   // none: a new school, not inspected yet
  link: string; date?: string; grade?: string;
  areas?: [string, string][];
  safeguarding?: string;
  graded?: { grade: string; date: string };
  ungraded?: { date: string; outcome: string };
  concern?: string; predecessor?: boolean;
}
export interface RawSchool {
  urn: number; name: string; place: string;   // national school ID (council codes clash between councils)
  method: 'walking' | 'straight_line' | 'unknown';
  pan?: number; d: YearRec[]; ll: LatLng; postcode: string; addr?: string;
  of?: Ofsted; type: string; own: boolean; src: string; web?: string; cz?: number[]; note?: string;
  tel?: string; email?: string;   // the school office, from GIAS and the school's website
  council: string;                // which council's file it came from: a key of COUNCILS
  district?: string;              // North Yorkshire's old district, for the area pages
  cu?: boolean;                   // has a catchment area, but the council publishes no map data to check it (Hull)
  con?: string;                   // parliamentary constituency, for the area pages of councils with no districts
}
export interface Area { name: string; p: LatLng[][][] }
export interface Data { schools: RawSchool[]; catch: Area[] }

export interface YearVerdict { v: V; label: string; diff?: number; y?: number }
export interface Verdict extends YearVerdict { chip?: string; c?: YearRec | null; yrs?: YearVerdict[] }

export interface School extends RawSchool {
  id: number;
  inC: boolean | null;
  straight?: number;
  walk?: number | null;
  walkErr?: boolean;
  used?: number | null;
  result?: Verdict | null;
}

// 'trend' judges across every published year, 'latest' on the newest, or a single year such as '2025'
export type Mode = 'trend' | 'latest' | `${number}`;

export const fmt = (m?: number | null) => (m == null ? 'n/a' : (m / MI).toFixed(2) + ' mi');
export const plural = (n: number, w: string, p?: string) => n + ' ' + (n === 1 ? w : p || w + 's');
export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

export function haversine(a: LatLng, b: LatLng) {
  const R = 6371008.8, r = (x: number) => (x * Math.PI) / 180;
  const dLat = r(b[0] - a[0]), dLng = r(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ---------- data ----------
let dataPromise: Promise<{ schools: School[]; catch: Area[] }> | null = null;
const getJSON = <T>(file: string) => fetch(import.meta.env.BASE_URL.replace(/\/?$/, '/') + 'data/' + file)
  .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<T>; });
type Box = [number, number, number, number];   // south, west, north, east
interface CouncilFile { file: string; catchCount: number; catch: { file: string; box: Box }[] }
// The catchment shape files and where each council's numbers start in the joined list, filled in by loadData
let shapeFiles: { file: string; box: Box; shift: number }[] = [];
const shapeLoads = new Map<string, Promise<void>>();
// One file of schools per council, listed in areas.json. Each council's catchment numbers are shifted so they still
// point at the right catchment once the councils are joined. The catchment shapes themselves aren't in it: the
// list has a gap for each until loadCatchments fetches the file it's in.
// A failed load isn't kept, so the next search tries again instead of failing until the page is reloaded
export function loadData() {
  dataPromise ??= getJSON<CouncilFile[]>('areas.json')
    .then(async (councils) => {
      const files = await Promise.all(councils.map((c) => getJSON<{ schools: RawSchool[] }>(c.file)));
      const out: { schools: School[]; catch: Area[] } = { schools: [], catch: [] };
      shapeFiles = [];
      councils.forEach((c, k) => {
        const shift = out.catch.length;
        out.catch.length += c.catchCount;
        shapeFiles.push(...c.catch.map((f) => ({ ...f, shift })));
        for (const s of files[k].schools) out.schools.push({ ...s, cz: s.cz?.map((i) => i + shift), id: out.schools.length, inC: null } as School);
      });
      return out;
    })
    .catch(() => { dataPromise = null; throw new Error('We couldn’t load the school details. Check your connection and try again.'); });
  return dataPromise;
}

// Whether a shape file's box comes within `mi` miles of a point
function boxNear([s, w, n, e]: Box, [lat, lng]: LatLng, mi: number) {
  const dLat = mi / 69, dLng = mi / (69 * Math.cos((lat * Math.PI) / 180));
  return lat >= s - dLat && lat <= n + dLat && lng >= w - dLng && lng <= e + dLng;
}
// Fetches the catchment shapes within reach of a search: every file whose shapes come within the search radius
// (plus a mile) of the home. Any catchment the home is in has the home inside its box, so it's always fetched, and
// so are the catchments of every school in range. With no point given, it fetches them all (the admin's map).
export async function loadCatchments(ll?: LatLng | null, radiusMi = 0) {
  const { catch: list } = await loadData();
  const want = shapeFiles.filter((f) => !ll || boxNear(f.box, ll, radiusMi + 1));
  await Promise.all(want.map((f) => {
    let p = shapeLoads.get(f.file);
    if (!p) {
      p = getJSON<{ c: { i: number; name: string; p: LatLng[][][] }[] }>(f.file)
        .then((d) => { for (const c of d.c) list[c.i + f.shift] = { name: c.name, p: c.p }; })
        .catch(() => { shapeLoads.delete(f.file); throw new Error('We couldn’t load the catchment areas. Check your connection and try again.'); });
      shapeLoads.set(f.file, p);
    }
    return p;
  }));
}

// ---------- catchments ----------
// Each area is [polygon, ...], each polygon [outer ring, ...holes], each ring [[lat, lng], ...].
function inRing(pt: LatLng, ring: LatLng[]) {
  const y = pt[0], x = pt[1];
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i], [yj, xj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
export const inArea = (pt: LatLng, area: Area) =>
  area.p.some((poly) => inRing(pt, poly[0]) && !poly.slice(1).some((h) => inRing(pt, h)));

// ---------- cut-off logic ----------
export function cutoff(s: School, mode: Mode) {
  if (mode === 'trend') return s.d.find((r) => r.s === 'distance') || s.d.find((r) => r.s !== 'not_published') || s.d[0] || null;
  if (mode === 'latest') return s.d.find((r) => r.s !== 'not_published') || s.d[0] || null;
  return s.d.find((r) => String(r.y) === mode) || null;
}
// A year whose last place went to a brother or sister (sib) or a child of staff (staff) from outside the catchment:
// everyone in the catchment got in and no other outsider did, so its distance doesn't help anyone else
export const noDist = (r: YearRec) => r.s === 'distance' && (r.g === 'sib' || r.g === 'staff');
// A DfE-only year where everyone who put the school first got it; one where they didn't is oversubscribed, with no
// cut-off to judge your chances by
export const firstsOk = (r: YearRec) => r.s === 'firsts' && r.fo! >= r.f!;
const FIRSTS_ALL = 'Everyone who put it first got a place';
const firstsOver = (r: YearRec) => `${r.f} put it first, but only ${r.fo} of them got a place. The national figures don’t say who got the last one`;
const isOver = (r?: YearRec | null) => r?.s === 'firsts' && !firstsOk(r);
export const WHO_ELSE = { sib: 'brothers and sisters of pupils', staff: 'children of staff' } as const;
// Whether a year's record can only be judged once your distance is known.
export function needsDist(r: YearRec, inC: boolean | null) {
  if (r.s !== 'distance' || noDist(r)) return false;
  if (r.g === 'out') return inC !== true && r.m! < UNDERSUB_M;
  if (r.g === 'in') return inC !== false;
  return true;
}
const IN_CATCH = 'You’re in the catchment, and everyone in the catchment got a place';

export function yearVerdict(c: YearRec | null, dist: number | null | undefined, inC: boolean | null): YearVerdict {
  if (!c) return { v: 'na', label: 'No figures for this year' };
  if (c.s === 'all_offered') return { v: 'all', label: 'Everyone who applied got a place' };
  if (c.s === 'firsts') return firstsOk(c) ? { v: 'all', label: FIRSTS_ALL } : { v: 'edge', label: firstsOver(c) };
  if (c.s === 'catchment') {
    if (inC) return c.ir ? { v: 'edge', label: `Not everyone in the catchment got a place: ${c.ia! - c.ir} of ${c.ia} did` } : { v: 'in', label: IN_CATCH };
    // outside the catchment, or a school without one: no distances, so only "nobody", "everyone" or "some" got in
    const who = inC === false ? 'children from outside the catchment' : 'applicants';
    const got = c.xa! - c.xr!;
    if (!got) return { v: 'out', label: `None of the ${c.xa} ${who} got a place` };
    if (!c.xr) return { v: 'in', label: `All ${c.xa} ${who} got a place` };
    return { v: 'edge', label: `${got} of ${c.xa} ${who} got a place, depending on brothers and sisters and distance` };
  }
  if (c.s !== 'distance') return { v: 'na', label: 'The council didn’t publish this year. Ask the school' };
  if (c.g === 'sib' || c.g === 'staff') {
    if (inC == null) return { v: 'na', label: 'Depends on whether you live in the catchment' };
    return inC
      ? { v: 'in', label: IN_CATCH }
      : { v: 'out', label: `From outside the catchment only ${WHO_ELSE[c.g]} got places, so you’d have missed out` };
  }
  if (c.g === 'out' && inC) return { v: 'in', label: IN_CATCH };
  if (c.g === 'in' && inC === false) return { v: 'out', label: 'Only children in the catchment got places, and you’re outside it' };
  if (c.g === 'out' && c.m! >= UNDERSUB_M && (dist == null || dist < c.m! - EDGE_M))
    return { v: 'all', label: `Places went to children up to ${fmt(c.m)} away, so you’d have got in` };
  if (dist == null) return { v: 'na', label: 'Working out your distance' };
  const rules = c.g === 'crit' ? ' (by the school’s own rules)' : '';
  const diff = c.m! - dist;
  if (Math.abs(diff) <= EDGE_M)
    return {
      v: 'edge', diff,
      label: diff >= 0
        ? `You’d have only just got in, with ${fmt(diff)} to spare${rules}. That’s within the 0.1 mile margin of error`
        : `You’d have only just missed out, by ${fmt(-diff)}${rules}. That’s within the 0.1 mile margin of error`,
    };
  return diff > 0
    ? { v: 'in', diff, label: `You’d have got in with ${fmt(diff)} to spare${rules}` }
    : { v: 'out', diff, label: `You’d have been ${fmt(-diff)} too far away${rules}` };
}

function trendVerdict(s: School, dist: number | null | undefined): Verdict {
  const yrs = s.d.map((r) => ({ y: r.y, ...yearVerdict(r, dist, s.inC) })).filter((r) => r.v !== 'na');
  const c = cutoff(s, 'trend');
  const pending = dist == null && s.d.some((r) => needsDist(r, s.inC));
  if (pending) return { v: 'na', label: 'Working out your distance', c, yrs };
  const n = yrs.length;
  if (!n) return { v: 'na', label: 'The council hasn’t published figures for this school. Ask the school', c, yrs };
  const ok = yrs.filter((r) => r.v === 'in' || r.v === 'all').length;
  const out = yrs.filter((r) => r.v === 'out').length;
  const yearsTxt = n === 1 ? 'the only year published' : n === 2 ? 'both years published' : `all ${n} years`;
  const one = n === 1 ? '. Only one year was published, so treat this with caution' : '';
  // with only the DfE's figures for some years, all that's known is that everyone who put it first got in
  const firstsYrs = s.d.some((r) => r.s === 'firsts' && yrs.some((y) => y.y === r.y));
  if (yrs.every((r) => r.v === 'all')) return { v: 'all', label: `${firstsYrs ? FIRSTS_ALL : 'Everyone who applied got a place'} in ${yearsTxt}`, c, yrs };
  const withDiff = yrs.filter((r) => r.diff != null);
  const nearest = () => withDiff.reduce<YearVerdict | null>((a, b) => (a && a.diff! > b.diff! ? a : b), null);
  if (ok === n) {
    const tight = withDiff.reduce<YearVerdict | null>((a, b) => (a && a.diff! < b.diff! ? a : b), null);
    const why = s.inC && !withDiff.length ? ', because you’re in the catchment' : '';
    return {
      v: 'in',
      label: `You’d have got a place in ${yearsTxt}` + why + (tight ? `. Closest call: ${tight.y}, with ${fmt(tight.diff)} to spare` : '') + one,
      c, yrs,
    };
  }
  if (out === n) {
    const near = nearest();
    return { v: 'out', label: `You’d have missed out in ${yearsTxt}` + (near ? `. Nearest miss: ${near.y}, ${fmt(-near.diff!)} too far` : '') + one, c, yrs };
  }
  // Close years with no distance to measure by (York): some from outside the catchment got in and some didn't
  const yrsOf = (l: YearVerdict[]) => l.map((r) => r.y).join(', ').replace(/, (?=\d+$)/, ' and ');
  const recOf = (y: YearVerdict) => s.d.find((r) => r.y === y.y)!;
  // Oversubscribed years with only the DfE's figures (Hull): no cut-off, so no way to judge your chances
  const over = yrs.filter((r) => r.v === 'edge' && recOf(r).s === 'firsts');
  // a single older year where a first choice or two missed out, with everyone getting in since, still reads as open
  if (over.length === 1 && over[0] !== yrs[0] && yrs.every((r) => r.v === 'all' || r === over[0])) {
    const x = recOf(over[0]);
    return { v: 'all', c, yrs, label: `Everyone who put it first got a place in ${yrsOf(yrs.filter((r) => r !== over[0]))}. In ${x.y}, ${x.f} put it first and ${x.fo} of them got a place` };
  }
  if (over.length) {
    const x = recOf(over[0]);
    const okFirsts = yrs.filter((r) => r.v === 'all' && recOf(r).s === 'firsts');
    const okOther = yrs.filter((r) => (r.v === 'in' || r.v === 'all') && recOf(r).s !== 'firsts');
    const outYrs = yrs.filter((r) => r.v === 'out');
    return {
      v: 'edge', chip: 'Oversubscribed', c, yrs,
      label: `In ${x.y}, ${firstsOver(x)}`
        + (okFirsts.length ? `. In ${yrsOf(okFirsts)}, everyone who put it first got in` : '')
        + (okOther.length ? `. You’d have got a place in ${yrsOf(okOther)}` : '')
        + (outYrs.length ? `. You’d have missed out in ${yrsOf(outYrs)}` : ''),
    };
  }
  const open = yrs.filter((r) => r.v === 'edge' && r.diff == null);
  if (open.length) {
    const who = s.inC === false ? 'children from outside the catchment' : s.inC ? 'children in the catchment' : 'applicants';
    const x = s.d.find((r) => r.s === 'catchment' && r.y === open[0].y)!;
    const [got, of] = s.inC ? [x.ia! - x.ir!, x.ia!] : [x.xa! - x.xr!, x.xa!];
    const latest = `In ${x.y}, ${got} of ${of} ${who} got a place`;
    if (open.length === n)
      return { v: 'edge', c, yrs, label: `${latest}. Only some got in ${n === 1 ? 'that year' : 'every year'}, so it depends on brothers and sisters and how near you live` };
    const okYrs = yrs.filter((r) => r.v === 'in' || r.v === 'all'), outYrs = yrs.filter((r) => r.v === 'out');
    return {
      v: 'edge', c, yrs,
      label: `${latest}, so it’s too close to call` + (okYrs.length ? `. You’d have got a place in ${yrsOf(okYrs)}` : '')
        + (outYrs.length ? `${okYrs.length ? ', and' : '. You’d have'} missed out in ${yrsOf(outYrs)}` : ''),
    };
  }
  const narrowIn = yrs.filter((r) => r.v === 'edge' && r.diff! >= 0);
  if (ok + narrowIn.length === n)
    return {
      v: 'edge', chip: 'Just inside', c, yrs,
      label: `You’d have got a place in ${yearsTxt}, but only just in ${narrowIn.map((r) => r.y).join(' and ')}, with under 0.1 mile to spare`,
    };
  const inside = ok + narrowIn.length;
  if (!inside) {
    const near = nearest();
    if (out) return { v: 'out', label: `You’d have missed out in ${yearsTxt}` + (near ? `. Nearest miss: ${near.y}, ${fmt(-near.diff!)} too far` : '') + one, c, yrs };
    return { v: 'edge', chip: 'Just outside', c, yrs, label: `You’d have just missed out in ${yearsTxt}, each time by under 0.1 mile, so it’s too close to call` };
  }
  const latest = yrs[0];
  const word = latest.v === 'edge' ? (latest.diff! >= 0 ? 'only just got in' : 'only just missed out')
    : ({ in: 'got in', all: 'got in, as everyone did', out: 'missed out' } as Record<string, string>)[latest.v];
  return { v: 'edge', label: `You’d have got a place in ${inside} of ${n} years. In ${latest.y} you’d have ${word}`, c, yrs };
}

export function verdict(s: School, dist: number | null | undefined, mode: Mode): Verdict {
  if (mode === 'trend') return trendVerdict(s, dist);
  const c = cutoff(s, mode);
  return { ...yearVerdict(c, dist, s.inC), ...(isOver(c) ? { chip: 'Oversubscribed' } : {}), c, yrs: [] };
}

// The label wording used across the redesign
export function chipText(r: Verdict | null | undefined, mode: Mode) {
  if (!r) return 'No data';
  if (r.label.startsWith('Working')) return 'Checking…';
  if (r.chip) return r.chip === 'Just inside' || r.chip === 'Just outside' ? 'It’s close' : r.chip;
  if (mode === 'trend') return { in: 'Safe bet', all: 'Open to all', edge: 'It’s close', out: 'Unlikely', na: 'No data' }[r.v];
  return { in: 'You’d get in', all: 'Open to all', edge: 'It’s close', out: 'Missed out', na: 'No data' }[r.v];
}
export const ORDER: Record<V, number> = { in: 0, all: 1, edge: 2, out: 3, na: 4 };

// The big plain-English answer at the top of a school's panel
export function headlineAnswer(s: School, mode: Mode) {
  const r = s.result;
  if (!r) return 'Check your postcode to see your chances.';
  if (r.label.startsWith('Working')) return 'Working out your distance…';
  if (r.chip === 'Oversubscribed') return 'Oversubscribed, and the council doesn’t publish who got in.';
  if (mode === 'trend' && r.yrs && r.yrs.length) {
    const n = r.yrs.length;
    const ok = r.yrs.filter((y) => y.v === 'in' || y.v === 'all' || (y.v === 'edge' && y.diff! >= 0)).length;
    const who = r.label.startsWith(FIRSTS_ALL) ? 'Everyone who put it first' : 'Everyone who applied';
    const allN = r.yrs.filter((y) => y.v === 'all').length;
    if (r.v === 'all' && allN < n) return `${who} got a place in ${allN} of the last ${n} years.`;
    if (r.v === 'all') return n === 1 ? `${who} got a place.` : `${who} got a place, ${n === 2 ? 'both' : 'all ' + n} years.`;
    if (ok === n) return n === 1 ? 'You’d have got in, the only year published.' : `You’d have got in every year, ${n === 2 ? 'both' : 'all ' + n} of them.`;
    const open = r.yrs.filter((y) => y.v === 'edge' && y.diff == null).length;   // York: some got in, some didn't
    if (ok === 0 && open) return open === n ? 'It’s too close to call.' : `Too close to call in ${open} of the last ${n} years.`;
    if (ok === 0) return n === 1 ? 'You’d have missed out, the only year published.' : `You’d have missed out in all ${n} years.`;
    return `You’d have got in ${ok} of the last ${n} years.`;
  }
  if (r.v === 'all' && r.label.startsWith(FIRSTS_ALL)) return `${FIRSTS_ALL}.`;
  return { in: 'You’d have got in.', all: 'Everyone who applied got a place.', edge: 'It’s too close to call.', out: 'You’d have missed out.', na: 'No figures to go on.' }[r.v];
}

// One year in plain English: who got a place that year
export function whoGotIn(x: YearRec) {
  if (x.s === 'distance') {
    const d = fmt(x.m);
    return x.g === 'out' ? `Everyone in the catchment, plus others within ${d}`
      : x.g === 'in' ? `Only children in the catchment, within ${d}`
      : x.g === 'sib' || x.g === 'staff' ? `Everyone in the catchment, plus ${WHO_ELSE[x.g]}`
      : x.g === 'near' ? `Brothers and sisters, then children within ${d}`
      : `Children within ${d}, by the school’s own rules`;
  }
  if (x.s === 'catchment') {
    const got = x.xa! - x.xr!;
    if (x.ir) return `Not everyone in the catchment: ${x.ia! - x.ir} of ${x.ia} got in`;
    if (!x.ia) return `${got} of ${x.xa} applicants`;   // a school without a catchment
    return got ? `Everyone in the catchment, plus ${got} of ${x.xa} from outside it` : 'Only children in the catchment';
  }
  if (x.s === 'firsts') return firstsOk(x) ? 'Everyone who put it first' : `${x.fo} of the ${x.f} who put it first`;
  return x.s === 'all_offered' ? 'Everyone who applied' : 'Not published by the council';
}
export function youText(yv: YearVerdict) {
  if (yv.v === 'edge' && yv.label.endsWith('who got the last one')) return 'Not known';
  if (yv.v === 'edge' && yv.diff == null) return 'Too close to call';
  if (yv.v === 'edge') return yv.diff! >= 0 ? 'Only just in' : 'Only just missed';
  if (yv.v === 'na') return yv.label.startsWith('Working') ? 'Working…' : 'Not known';
  return { in: 'Yes', all: 'Yes', out: 'Missed out' }[yv.v];
}

// ---------- Ofsted ----------
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const mon = (iso?: string) => (iso ? MONTHS[+iso.slice(5, 7) - 1] + ' ' + iso.slice(0, 4) : '');
const RANK: Record<string, number> = {
  Exceptional: 0, Outstanding: 0, 'Strong standard': 1, Good: 1, 'Expected standard': 1,
  'Needs attention': 2, 'Requires improvement': 2, 'Urgent improvement': 3, Inadequate: 3,
};
export type Tone = 'top' | 'ok' | 'warn' | 'bad' | 'na';
const toneOf = (w: number | null | undefined): Tone => (['top', 'ok', 'warn', 'bad'] as Tone[])[w ?? -1] || 'na';
export function ofsted(o?: Ofsted): { tone: Tone; head: string; sub: string; short: string } {
  if (!o) return { tone: 'na', head: 'No match', sub: '', short: 'Not found' };
  if (o.kind === 'none' || (o.kind === 'ungraded' && !o.ungraded)) return { tone: 'na', head: 'Not inspected yet', sub: 'No Ofsted report published yet', short: 'Not inspected' };
  const areas = o.areas || [];
  const worst = areas.length ? Math.max(...areas.map((a) => RANK[a[1]] ?? 1)) : null;
  let head: string, sub = '', tone: Tone, short: string;
  if (o.kind === 'card') {
    head = 'Report card'; short = 'Report card';
    sub = `No overall grade. Rated in ${areas.length} areas, ${mon(o.date)}`;
    tone = areas.every((a) => a[1] === 'Exceptional') ? 'top' : toneOf(worst);
    if (o.safeguarding === 'Not met') tone = 'bad';
  } else if (o.kind === 'grade') {
    head = o.grade!; short = o.grade!; sub = 'Graded ' + mon(o.date); tone = toneOf(RANK[o.grade!]);
  } else if (o.kind === 'areas') {
    const counts = areas.reduce<Record<string, number>>((t, a) => ((t[a[1]] = (t[a[1]] || 0) + 1), t), {});
    const [top, n] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    head = (n === areas.length ? 'All ' : 'Mostly ') + top; short = head;
    sub = `No overall grade. Area grades from ${mon(o.date)}`; tone = toneOf(worst);
  } else {
    const m = /remains (Outstanding|Good)(?: \((\w+)\))?/.exec(o.ungraded!.outcome);
    const grade = m ? m[1] : o.graded?.grade;
    head = grade ? grade + (m?.[2] ? ' (' + m[2].toLowerCase() + ')' : '') : o.ungraded!.outcome;
    short = grade || 'Short inspection';
    tone = m?.[2] === 'Concerns' ? 'warn' : grade ? toneOf(RANK[grade]) : 'ok';
    sub = (o.graded ? `Graded ${mon(o.graded.date)}, ` : '') + `confirmed at a short inspection ${mon(o.date)}`;
  }
  if (o.concern) { tone = 'bad'; sub += '. ' + o.concern; }
  return { tone, head, sub, short };
}

// ---------- walking distances (one table request per search) ----------
const walkCache = new Map<string, Record<number, number>>();
export async function walkingDistances(from: LatLng, list: School[]) {
  if (!list.length) return {};
  const coords = [from, ...list.map((s) => s.ll)].map((p) => p[1].toFixed(6) + ',' + p[0].toFixed(6)).join(';');
  if (walkCache.has(coords)) return walkCache.get(coords)!;
  try { const hit = sessionStorage.getItem('ysc-walk:' + coords); if (hit) { const v = JSON.parse(hit); walkCache.set(coords, v); return v as Record<number, number>; } } catch {}
  const r = await fetch(ROUTER + coords + '?sources=0&annotations=distance&generate_hints=false', { signal: AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error(r.status === 429 ? 'busy' : 'router ' + r.status);
  const j = await r.json();
  const out: Record<number, number> = {};
  list.forEach((s, i) => { const d = j.distances?.[0]?.[i + 1]; if (d != null) out[s.id] = d; });
  walkCache.set(coords, out);
  try { sessionStorage.setItem('ysc-walk:' + coords, JSON.stringify(out)); } catch {}
  return out;
}

// ---------- postcodes ----------
export const PC_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
export interface Place { ll: LatLng; label: string; district: string | null; isPostcode: boolean }
export async function lookupPostcode(pc: string): Promise<Place> {
  pc = pc.trim();
  if (!pc) throw new Error('Enter a postcode to check, for example HG2 0NA.');
  if (!PC_RE.test(pc)) throw new Error('That doesn’t look like a full postcode. Try one like HG2 0NA.');
  let r: Response;
  try {
    r = await fetch('https://api.postcodes.io/postcodes/' + encodeURIComponent(pc));
    // a postcode that's been withdrawn still has a location
    if (r.status === 404) r = await fetch('https://api.postcodes.io/terminated_postcodes/' + encodeURIComponent(pc));
  } catch {
    throw new Error('We couldn’t reach the postcode service. Check your connection.');
  }
  if (r.status !== 404 && !r.ok) throw new Error('The postcode service is busy. Try again in a moment.');
  // an error page from the service (or anything in between) isn't JSON
  let j: { result?: { latitude: number; longitude: number; postcode: string; admin_district?: string } };
  try { j = await r.json(); } catch { throw new Error('The postcode service is busy. Try again in a moment.'); }
  if (!j.result) throw new Error('We couldn’t find that postcode. Check it and try again.');
  return { ll: [j.result.latitude, j.result.longitude], label: j.result.postcode, district: j.result.admin_district ?? null, isPostcode: true };
}

// ---------- the whole search: catchments, straight lines, then walking routes ----------
export interface SearchResult {
  near: School[];
  mine: School[];          // schools whose catchment you're in
  areas: Set<number>;
  outside: string;         // a message when the point is outside the district
}
export function prepareSearch(all: School[], catches: Area[], place: Place, radiusMi: number): SearchResult {
  const ll = place.ll;
  // catchments not fetched yet are gaps in the list (loadCatchments fetches every one the home could be in)
  const areas = new Set<number>();
  catches.forEach((a, i) => { if (a && inArea(ll, a)) areas.add(i); });
  all.forEach((s) => { s.inC = s.cz ? s.cz.some((i) => areas.has(i)) : null; s.result = null; s.walk = null; s.walkErr = false; s.straight = haversine(ll, s.ll); });
  const R = radiusMi * MI;
  const near = all.filter((s) => s.ll && s.straight! <= R);
  const shown = place.label === 'your location' ? 'Your location' : place.label;
  const outside = place.district && !COUNCILS[place.district]
    ? `${place.label} is in ${place.district}, which this checker doesn’t cover yet, so schools there aren’t shown.`
    // no catchment around it and no council we cover: outside our areas. A covered council's catchments needn't cover
    // all of it (Leeds maps only its community schools'; Hull's can't be checked), so a postcode there isn't outside
    : !areas.size && !(place.district && COUNCILS[place.district]) ? `${shown} is outside the areas this checker covers, so schools there aren’t shown.` : '';
  return { near, mine: all.filter((s) => s.inC), areas, outside };
}
export function scoreAll(list: School[], mode: Mode) {
  for (const s of list) {
    s.used = s.method === 'walking' ? (s.walk ?? (s.walkErr ? s.straight : null)) : s.straight;
    s.result = verdict(s, s.used, mode);
    // the straight line is shorter than any walk, so a good result from it can't be trusted
    if (s.method === 'walking' && s.walkErr && (s.result.v === 'in' || s.result.v === 'edge') && s.d.some((r) => needsDist(r, s.inC)))
      s.result = { ...s.result, v: 'na', chip: 'Check', label: 'Walking route unavailable. By straight line: ' + s.result.label.charAt(0).toLowerCase() + s.result.label.slice(1) };
  }
}
export async function addWalking(place: Place, list: School[]) {
  const walkers = list.filter((s) => s.method === 'walking');
  if (!walkers.length) return '';
  try {
    const w = await walkingDistances(place.ll, walkers);
    walkers.forEach((s) => (s.walk = w[s.id] ?? null));
    return '';
  } catch (e) {
    walkers.forEach((s) => (s.walkErr = true));
    return ((e as Error).message === 'busy' ? 'The walking-route service is busy' : 'The walking-route service didn’t respond')
      + ', so schools measured by walking are marked “Check”. Try again in a minute.';
  }
}

// ---------- key dates ----------
export const CLOSE = Date.UTC(2027, 0, 15);
export const OFFERS = Date.UTC(2027, 3, 16);
export function dateState(now = new Date()) {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((CLOSE - today) / 864e5);
  if (days >= 0) return { phase: 'open' as const, days };
  if (today < OFFERS) return { phase: 'closed' as const, days: Math.round((OFFERS - today) / 864e5) };
  return { phase: 'offered' as const, days: 0 };
}
