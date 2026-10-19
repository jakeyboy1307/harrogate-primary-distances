// What the site remembers on this device: the ranked list and the last search.
// The list uses the same key as the live checker, so existing shortlists carry over.
import { MAX_SHORT, type Mode, type Place } from './engine';

const get = <T>(k: string, d: T): T => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } };
const set = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export interface SavedSearch { place: Place; radius: number; mode: Mode }

type Listener = () => void;
const listeners = new Set<Listener>();
export const onListChange = (f: Listener) => { listeners.add(f); return () => listeners.delete(f); };
const emit = () => listeners.forEach((f) => f());

export function getList(): number[] { return get<number[]>('ysc-shortlist', []).slice(0, MAX_SHORT); }
export function setList(list: number[]) { set('ysc-shortlist', list.slice(0, MAX_SHORT)); emit(); }
export function inList(dfe: number) { return getList().includes(dfe); }
export function rankOf(dfe: number) { const i = getList().indexOf(dfe); return i < 0 ? null : i + 1; }
export function addToList(dfe: number): 'added' | 'full' | 'already' {
  const l = getList();
  if (l.includes(dfe)) return 'already';
  if (l.length >= MAX_SHORT) return 'full';
  setList([...l, dfe]);
  return 'added';
}
export function removeFromList(dfe: number) { setList(getList().filter((d) => d !== dfe)); }
export function moveInList(dfe: number, to: number) {
  const l = getList().filter((d) => d !== dfe);
  l.splice(Math.max(0, Math.min(to, l.length)), 0, dfe);
  setList(l);
}

export function getSearch(): SavedSearch | null { return get<SavedSearch | null>('ysc-search', null); }
export function setSearch(s: SavedSearch | null) { set('ysc-search', s); }

const SUFFIX: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
export const ordinal = (n: number) => n + (SUFFIX[n] ?? 'th');   // the list never goes past 5th
