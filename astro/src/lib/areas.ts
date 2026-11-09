// Build-time facts for the area pages (harrogate-primary-schools, york-primary-schools), worked out from the same
// council files the checker loads, so the pages stay right whenever the data is refreshed.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { firstsOk, MI, whoGotIn, type RawSchool, type YearRec } from './engine';

export type AreaSchool = RawSchool & { district?: string };

const readData = (file: string) => JSON.parse(readFileSync(join(process.cwd(), 'public/data', file), 'utf8'));
export const loadArea = (file: string): AreaSchool[] => readData(file).schools;
// Every council's data file, as listed in public/data/areas.json (scripts/copy-data.mjs)
export const councilFiles = (): string[] => readData('areas.json').map((c: { file: string }) => c.file);
export const loadAll = (): AreaSchool[] => councilFiles().flatMap(loadArea);
// the newest refresh date across the council data files
export const dataDate = () => (councilFiles().map((f) => readData(f).updated as string | undefined).filter(Boolean) as string[]).sort().pop();

const latest = (s: AreaSchool) => s.d.find((r) => r.s !== 'not_published');

// How hard the latest year was to get into, higher is harder. Null when everyone got in or it can't be told.
function difficulty(r?: YearRec) {
  if (!r) return null;
  if (r.s === 'distance') {
    if (r.g === 'in') return 3 + 1 / (1 + r.m! / MI);              // only catchment children, nearest first
    if (r.g === 'sib' || r.g === 'staff') return 2.5;               // outside the catchment, only brothers and sisters or staff children
    if (r.g === 'out') return r.m! < 2 * MI ? 1 + 1 / (1 + r.m! / MI) : null;
    return null;                                                    // the school's own rules
  }
  if (r.s === 'firsts') return firstsOk(r) ? null : 1 + 1 - r.fo! / r.f!;   // share of first choices turned away
  if (r.s === 'catchment') {
    if (r.ir) return 3 + r.ir / r.ia!;                              // some in the catchment missed out
    return r.xa ? 1 + r.xr! / r.xa : null;                          // share of outside applicants turned away
  }
  return null;
}

export function hardest(schools: AreaSchool[], n = 8) {
  return schools
    .map((s) => ({ s, r: latest(s)!, score: difficulty(latest(s)) }))
    .filter((x) => x.score != null)
    .sort((a, b) => b.score! - a.score!)
    .slice(0, n)
    .map(({ s, r }) => ({ urn: s.urn, name: s.name, place: s.place, year: r.y, who: whoGotIn(r), applied: r.a, places: r.p }));
}

// Everyone who applied got a place (or, with only the DfE's figures, everyone who put it first)
const open = (r?: YearRec) => !!r && (r.s === 'all_offered' || firstsOk(r));
// Schools that took everyone in the latest year published
export const openLatest = (schools: AreaSchool[]) => schools.filter((s) => open(latest(s)));

// Schools where everyone who applied got a place in every year published
export const openToAll = (schools: AreaSchool[]) =>
  schools.filter((s) => s.d.length && s.d.every(open));

// Outstanding at the latest graded inspection, including schools whose later short (ungraded) inspections kept that grade
export const outstanding = (schools: AreaSchool[]) =>
  schools.filter((s) => (s.of?.kind === 'grade' && s.of.grade === 'Outstanding') || (s.of?.kind === 'ungraded' && s.of.graded?.grade === 'Outstanding'));

// Schools grouped by town or village, biggest groups first, then alphabetically
export function byPlace(schools: AreaSchool[]) {
  const groups = new Map<string, AreaSchool[]>();
  for (const s of schools) groups.set(s.place, [...(groups.get(s.place) ?? []), s]);
  return [...groups].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
}
