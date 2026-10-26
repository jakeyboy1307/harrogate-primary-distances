// The admissions logic, ported from the live checker (build/template.html) so results match it exactly.

export const MI = 1609.344;
export const EDGE_M = 0.1 * MI;     // borderline band: a tenth of a mile
export const UNDERSUB_M = 2 * MI;   // an out-of-catchment cut-off this long means nobody local missed out
export const MAX_SHORT = 5;         // North Yorkshire's application form takes five preferences
export const ROUTER = 'https://routing.openstreetmap.de/routed-foot/table/v1/foot/';
export const CATCH_MAP = 'https://experience.arcgis.com/experience/4dd5b97eae514b31a067137ebf7cdd6a';
export const APPLY_URL = 'https://www.northyorks.gov.uk/education-and-learning/education-and-learning/school-admissions/starting-primary-school-and-junior-school';

export type LatLng = [number, number];
export type V = 'in' | 'all' | 'edge' | 'out' | 'na';

export interface YearRec {
  y: number;
  s: 'distance' | 'all_offered' | 'not_published';
  m?: number;
  g?: 'in' | 'out' | 'sib' | 'crit';
  crit?: string;
  a?: number; o?: number; p?: number; f?: number;
  n?: string;
}
export interface Ofsted {
  kind: 'card' | 'grade' | 'areas' | 'ungraded';
  link: string; date?: string; grade?: string;
  areas?: [string, string][];
  safeguarding?: string;
  graded?: { grade: string; date: string };
  ungraded?: { date: string; outcome: string };
  concern?: string; predecessor?: boolean;
}
export interface RawSchool {
  dfe: number; name: string; place: string;
  method: 'walking' | 'straight_line' | 'unknown';
  pan?: number; d: YearRec[]; ll: LatLng; postcode: string; addr?: string;
  of?: Ofsted; type: string; own: boolean; src: string; web?: string; cz?: number[]; note?: string;
  tel?: string; email?: string;   // the school office, from GIAS and the school's website
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
// A failed load isn't kept, so the next search tries again instead of failing until the page is reloaded
export function loadData() {
  dataPromise ??= fetch(import.meta.env.BASE_URL.replace(/\/?$/, '/') + 'data.json')
    .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<Data>; })
    .then((d) => ({ catch: d.catch, schools: d.schools.map((s, i) => ({ ...s, id: i, inC: null })) }))
    .catch(() => { dataPromise = null; throw new Error('We couldn’t load the school details. Check your connection and try again.'); });
  return dataPromise;
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
// Whether a year's record can only be judged once your distance is known.
export function needsDist(r: YearRec, inC: boolean | null) {
  if (r.s !== 'distance' || r.g === 'sib') return false;
  if (r.g === 'out') return inC !== true && r.m! < UNDERSUB_M;
  if (r.g === 'in') return inC !== false;
  return true;
}
const IN_CATCH = 'You’re in the catchment, and everyone in the catchment got a place';

export function yearVerdict(c: YearRec | null, dist: number | null | undefined, inC: boolean | null): YearVerdict {
  if (!c) return { v: 'na', label: 'No figures for this year' };
  if (c.s === 'all_offered') return { v: 'all', label: 'Everyone who applied got a place' };
  if (c.s !== 'distance') return { v: 'na', label: 'The council didn’t publish this year. Ask the school' };
  if (c.g === 'sib') {
    if (inC == null) return { v: 'na', label: 'Depends on whether you live in the catchment' };
    return inC
      ? { v: 'in', label: IN_CATCH }
      : { v: 'out', label: 'From outside the catchment only brothers and sisters of pupils got places, so you’d have missed out' };
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
  if (yrs.every((r) => r.v === 'all')) return { v: 'all', label: `Everyone who applied got a place in ${yearsTxt}`, c, yrs };
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
  return { ...yearVerdict(c, dist, s.inC), c, yrs: [] };
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
  if (mode === 'trend' && r.yrs && r.yrs.length) {
    const n = r.yrs.length;
    const ok = r.yrs.filter((y) => y.v === 'in' || y.v === 'all' || (y.v === 'edge' && y.diff! >= 0)).length;
    if (r.v === 'all') return n === 1 ? 'Everyone who applied got a place.' : `Everyone who applied got a place, ${n === 2 ? 'both' : 'all ' + n} years.`;
    if (ok === n) return n === 1 ? 'You’d have got in, the only year published.' : `You’d have got in every year, ${n === 2 ? 'both' : 'all ' + n} of them.`;
    if (ok === 0) return n === 1 ? 'You’d have missed out, the only year published.' : `You’d have missed out in all ${n} years.`;
    return `You’d have got in ${ok} of the last ${n} years.`;
  }
  return { in: 'You’d have got in.', all: 'Everyone who applied got a place.', edge: 'It’s too close to call.', out: 'You’d have missed out.', na: 'No figures to go on.' }[r.v];
}

// One year in plain English: who got a place that year
export function whoGotIn(x: YearRec) {
  if (x.s === 'distance') {
    const d = fmt(x.m);
    return x.g === 'out' ? `Everyone in the catchment, plus others within ${d}`
      : x.g === 'in' ? `Only children in the catchment, within ${d}`
      : x.g === 'sib' ? 'Everyone in the catchment, plus brothers and sisters of pupils'
      : `Children within ${d}, by the school’s own rules`;
  }
  return x.s === 'all_offered' ? 'Everyone who applied' : 'Not published by the council';
}
export function youText(yv: YearVerdict) {
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
  const areas = new Set(catches.map((a, i) => (inArea(ll, a) ? i : -1)).filter((i) => i >= 0));
  all.forEach((s) => { s.inC = s.cz ? s.cz.some((i) => areas.has(i)) : null; s.result = null; s.walk = null; s.walkErr = false; s.straight = haversine(ll, s.ll); });
  const R = radiusMi * MI;
  const near = all.filter((s) => s.ll && s.straight! <= R);
  const shown = place.label === 'your location' ? 'Your location' : place.label;
  const outside = place.district && place.district !== 'North Yorkshire'
    ? `${place.label} is in ${place.district}, which this checker doesn’t cover yet, so schools there aren’t shown.`
    : !areas.size ? `${shown} is outside the Harrogate district, so schools in other areas aren’t shown.` : '';
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
