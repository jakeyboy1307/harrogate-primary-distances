// What the site remembers on this device: the ranked list (of school URNs) and the last search.
import { MAX_SHORT, type Mode, type Place } from './engine';
import legacyIds from './legacy-ids.json';

const get = <T>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const set = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// Lists saved before November 2026 used North Yorkshire's own school codes. Move them to URNs once, keeping the order.
// legacy-ids.json is a fixed record of those codes: don't regenerate it.
const OLD_KEY = 'ysc-shortlist', KEY = 'ysc-list';
try {
  if (localStorage.getItem(KEY) == null && localStorage.getItem(OLD_KEY) != null) {
    const old = get<number[]>(OLD_KEY, []);
    set(KEY, old.map((code) => (legacyIds as Record<string, number>)[code]).filter(Boolean));
    localStorage.removeItem(OLD_KEY);
  }
} catch {}

export interface SavedSearch { place: Place; radius: number; mode: Mode }

type Listener = () => void;
const listeners = new Set<Listener>();
export const onListChange = (f: Listener) => { listeners.add(f); return () => listeners.delete(f); };
const emit = () => listeners.forEach((f) => f());

export function getList(): number[] { return get<number[]>(KEY, []).slice(0, MAX_SHORT); }
export function setList(list: number[]) { set(KEY, list.slice(0, MAX_SHORT)); emit(); }
export function inList(urn: number) { return getList().includes(urn); }
export function rankOf(urn: number) { const i = getList().indexOf(urn); return i < 0 ? null : i + 1; }
export function addToList(urn: number): 'added' | 'full' | 'already' {
  const l = getList();
  if (l.includes(urn)) return 'already';
  if (l.length >= MAX_SHORT) return 'full';
  setList([...l, urn]);
  return 'added';
}
export function removeFromList(urn: number) { setList(getList().filter((d) => d !== urn)); }
export function moveInList(urn: number, to: number) {
  const l = getList().filter((d) => d !== urn);
  l.splice(Math.max(0, Math.min(to, l.length)), 0, urn);
  setList(l);
}

export function getSearch(): SavedSearch | null { return get<SavedSearch | null>('ysc-search', null); }
export function setSearch(s: SavedSearch | null) { set('ysc-search', s); }

const SUFFIX: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
export const ordinal = (n: number) => n + (SUFFIX[n] ?? 'th');   // the list never goes past 5th
