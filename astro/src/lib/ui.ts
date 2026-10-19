import { chipText, esc, fmt, type Mode, type School, type V } from './engine';

export const $ = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = document) => root.querySelector<T>(s)!;
export const $$ = <T extends HTMLElement = HTMLElement>(s: string, root: ParentNode = document) => [...root.querySelectorAll<T>(s)];

let toastTimer: number | undefined;
export function toast(t: string) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = t; el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (el.hidden = true), 3400);
}

export const vOf = (s: School): V => s.result?.v ?? 'na';
export const chip = (s: School, mode: Mode, small = false) =>
  `<span class="chip v-${vOf(s)}${small ? ' chip-sm' : ''}">${esc(chipText(s.result, mode))}</span>`;

// Shortened names for tight spaces, e.g. "Grove Road Community Primary School" -> "Grove Road Community Primary"
export const shortName = (n: string) =>
  n.replace(/Church of England/g, 'CofE').replace(/\bC of E\b/g, 'CofE')
   .replace(/,.*$/, '').replace(/ (and|&) Nursery$/, '').replace(/ School$/, '');

// "0.75 mi walk", or a straight-line distance while walking routes load or when they fail
export const distTxt = (s: School) => {
  const m = s.used ?? s.straight;
  if (m == null) return '';
  const how = s.method === 'walking' && s.walk != null ? 'walk' : 'straight line';
  return `${fmt(m)} ${how}`;
};

export const ICON = {
  grip: '<svg width="12" height="20" viewBox="0 0 12 20" aria-hidden="true"><g fill="currentColor"><circle cx="3" cy="3" r="2"/><circle cx="9" cy="3" r="2"/><circle cx="3" cy="10" r="2"/><circle cx="9" cy="10" r="2"/><circle cx="3" cy="17" r="2"/><circle cx="9" cy="17" r="2"/></g></svg>',
  tick: '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="10" fill="#1D8A45"/><path d="M6 10.5l2.5 2.5L14 7.5" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>',
  tickY: '<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="11" fill="#FFE45C"/><path d="M6.5 11.5l3 3 6-6.5" stroke="#14182B" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>',
  warnY: '<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="10" fill="none" stroke="#FFE45C" stroke-width="2"/><path d="M11 6v6M11 15.5v.5" stroke="#FFE45C" stroke-width="2.2" stroke-linecap="round"/></svg>',
  warn: '<svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="none" stroke="#B26A00" stroke-width="2"/><path d="M10 5.5v6M10 14.5v.5" stroke="#B26A00" stroke-width="2.2" stroke-linecap="round"/></svg>',
  close: '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3L3 13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  list: '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M3 4.5h12M3 9h12M3 13.5h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  map: '<svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true"><path d="M2 4l4.5-2 5 2L16 2v12l-4.5 2-5-2L2 16z M6.5 2v12 M11.5 4v12" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linejoin="round"/></svg>',
};
