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
export function removeFromList(urn: number) { setList(getList().filter((d) => d !== urn)); }
export function moveInList(urn: number, to: number) {
  const l = getList().filter((d) => d !== urn);
  l.splice(Math.max(0, Math.min(to, l.length)), 0, urn);
  setList(l);
}

// Backups: schools a parent likes but can't fit in their five. They never go on the council form, and can be
// moved into the list at any time (the school in 5th place swaps down when the list is full).
const BACKUP_KEY = 'ysc-backups';
export const MAX_BACKUPS = 10;
export function getBackups(): number[] {
  const list = getList();
  return get<number[]>(BACKUP_KEY, []).filter((u) => !list.includes(u)).slice(0, MAX_BACKUPS);
}
export const backupOf = (urn: number) => getBackups().includes(urn);
export function removeBackup(urn: number) { set(BACKUP_KEY, getBackups().filter((u) => u !== urn)); emit(); }
// Save the list and the backups together, after a drag between them. If the list is over five, the last school
// other than `keep` (the one just moved in) drops to the top of the backups. Returns that school, if any.
export function setListAndBackups(list: number[], backups: number[], keep?: number) {
  list = [...list];
  let down: number | null = null;
  if (list.length > MAX_SHORT) {
    const i = list.map((u) => u !== keep).lastIndexOf(true);
    down = list.splice(i, 1)[0];
  }
  set(KEY, list.slice(0, MAX_SHORT));
  set(BACKUP_KEY, [...(down != null ? [down] : []), ...backups.filter((u) => !list.includes(u) && u !== down)].slice(0, MAX_BACKUPS));
  emit();
  return down;
}
// Move a backup into the list: last if there's room, else into 5th place, swapping the 5th school down
export function promoteBackup(urn: number) {
  const list = getList().filter((u) => u !== urn);
  list.splice(Math.min(list.length, MAX_SHORT - 1), 0, urn);
  return setListAndBackups(list, getBackups().filter((u) => u !== urn), urn);
}

// The one way to add a school from a button: into the list if there's room, else to the backups
export type AddResult = 'added' | 'backup' | 'already' | 'full';
export function addSchool(urn: number): AddResult {
  const list = getList();
  if (list.includes(urn) || backupOf(urn)) return 'already';
  if (list.length < MAX_SHORT) {
    setList([...list, urn]);
    set(BACKUP_KEY, getBackups().filter((u) => u !== urn));
    return 'added';
  }
  if (getBackups().length >= MAX_BACKUPS) return 'full';
  set(BACKUP_KEY, [...getBackups(), urn]);
  emit();
  return 'backup';
}
export function addedText(urn: number, r: AddResult) {
  if (r === 'added') return `Added as your ${ordinal(rankOf(urn)!)} choice`;
  if (r === 'backup') return 'Added to your backups. Drag it into your list to swap it in.';
  if (r === 'full') return `You have ${MAX_BACKUPS} backups already. Remove one to add another.`;
  return rankOf(urn) ? `Already your ${ordinal(rankOf(urn)!)} choice` : 'Already one of your backups';
}
// The label for an "add" button: what pressing it will do
export const addLabel = () => (getList().length < MAX_SHORT ? `Add as ${ordinal(getList().length + 1)}` : 'Add as a backup');

export function getSearch(): SavedSearch | null { return get<SavedSearch | null>('ysc-search', null); }
export function setSearch(s: SavedSearch | null) { set('ysc-search', s); }

const SUFFIX: Record<number, string> = { 1: 'st', 2: 'nd', 3: 'rd' };
export const ordinal = (n: number) => n + (SUFFIX[n] ?? 'th');   // the list never goes past 5th
