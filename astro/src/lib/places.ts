// Every place a parent might type to find their page: council pages, area pages, town pages, and the other places
// named in area page titles ("Kirkstall", "Saltaire"), which go to their area. Used by the footer's "Find your town"
// box (through /places.json) and the all-areas page. Build time only.
import { HUBS } from './hubs';
import { AREA_INFO, councilLabel, type Area } from './specs';
import { townPages } from './towns';

export interface Place {
  name: string;   // what's shown and matched: "Ripon", "Roundhay, Leeds", "Leeds (council)"
  page: string;   // the page's address, without the leading slash
}

export function places(): Place[] {
  const out: Place[] = [];
  const seen = new Set<string>();
  const add = (name: string, page: string) => {
    const k = name.toLowerCase();
    if (!seen.has(k)) { seen.add(k); out.push({ name, page }); }
  };
  // towns first, so "Ripon" goes to Ripon's own page rather than the area that names it
  for (const t of townPages()) add(t.label, t.page);
  // and a suburb's own name, so "Roundhay" goes to Roundhay's page, not the area page that names it
  for (const t of townPages()) add(t.name, t.page);
  for (const h of Object.values(HUBS)) add(h.name, h.page);
  for (const a of Object.values(AREA_INFO)) {
    add(a.name, a.page);
    if (a.short !== a.name) add(a.short, a.page);
    // each place an area page names: "Walkley, Broomhill, Sharrow and Nether Edge" → Walkley, Broomhill...
    for (const p of a.name.split(/,\s*|\s+and\s+/)) {
      const name = p.replace(/^the\s+/i, '').replace(/\s+(town|villages)$/i, '').trim();
      if (name && !/^(villages|central Leeds)$/i.test(name)) add(/^[A-Z]/.test(name) ? name : a.short, a.page);
    }
  }
  // councils by name too, where they have no council page of their own (York, Wakefield, Rotherham...)
  for (const a of Object.values(AREA_INFO)) add(councilLabel(a.council), (Object.values(AREA_INFO).find((x) => x.council === a.council) ?? a).page);
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// The areas by council, in the order AREA_INFO lists them, for the all-areas page
export function byCouncil() {
  const groups = new Map<string, Area[]>();
  for (const k of Object.keys(AREA_INFO) as Area[]) {
    const c = AREA_INFO[k].council;
    groups.set(c, [...(groups.get(c) ?? []), k]);
  }
  return [...groups];
}
