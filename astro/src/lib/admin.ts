// Small helpers shared by the admin pages: calling the admin API, messages, and formatting.
import { esc } from './engine';
import { AREA_SHORT, SPOTS, type Area, type Placement } from './specs';
export { esc };

export class ApiError extends Error {}

// Call the admin API. Throws ApiError with the server's plain-English message when something's wrong.
export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const r = await fetch(`/api/admin/${path}`, {
    method: opts.method ?? (opts.body ? 'POST' : 'GET'),
    headers: opts.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  // signed out (the session ran out): send them back through the login
  if (r.status === 403 || r.redirected) { location.reload(); throw new ApiError('Signed out'); }
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new ApiError(data.error ?? `Something went wrong (${r.status}).`);
  return data as T;
}

let timer: number | undefined;
export function toast(text: string, bad = false) {
  const el = document.getElementById('admToast');
  if (!el) return;
  el.textContent = text;
  el.classList.toggle('bad', bad);
  el.hidden = false;
  clearTimeout(timer);
  timer = window.setTimeout(() => (el.hidden = true), bad ? 6000 : 3000);
}

export interface Ad {
  id: number; advertiserId: number | null; advertiser: string | null;
  status: 'draft' | 'live' | 'paused' | 'ended'; state: 'draft' | 'paused' | 'ended' | 'showing' | 'scheduled' | 'finished';
  placements: Placement[]; areas: Area[]; urns: number[] | null;
  name: string; category: string; blurb: string; cta: string; url: string;
  logoText: string | null; logoUrl: string | null; colour: string | null; offer: string | null; openDays: string[] | null;
  start: string | null; end: string | null; pricePence: number | null; pricePeriod: 'month' | 'year' | 'once' | null; paid: boolean;
  demo: boolean; created: string; updated: string;
}
export interface Advertiser {
  id: number; name: string; contactName: string | null; email: string | null; phone: string | null; notes: string | null;
  demo: boolean; created: string; ads: number; live: number; bookedPence: number;
}

// 1 November 2026
export const day = (d?: string | null) => d ? new Date(d.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
export const dates = (a: { start: string | null; end: string | null }) =>
  a.start && a.end ? `${day(a.start)} to ${day(a.end)}` : a.start ? `From ${day(a.start)}` : a.end ? `Until ${day(a.end)}` : 'No end date';
export const money = (p: number | null | undefined, period?: string | null) =>
  p == null ? '' : `£${(p / 100).toLocaleString('en-GB', { minimumFractionDigits: p % 100 ? 2 : 0 })}${period && period !== 'once' ? ` a ${period}` : ''}`;
export const spotNames = (ps: Placement[]) => ps.map((p) => SPOTS[p]?.label ?? p).join(', ');
export const areaNames = (as: Area[]) => as.map((a) => AREA_SHORT[a] ?? a).join(', ');

const STATE: Record<Ad['state'], [string, string]> = {
  showing: ['Showing', 'good'], scheduled: ['Scheduled', 'open'], finished: ['Dates passed', 'none'],
  draft: ['Draft', 'none'], paused: ['Paused', 'close'], ended: ['Ended', 'bad'],
};
export const statePill = (s: Ad['state']) => `<span class="pill-s ${STATE[s][1]}">${STATE[s][0]}</span>`;

// "Are you sure?" in the admin's own dialog. Resolves true if they press the confirm button.
export function confirmAction(text: string, yes = 'Yes, do it'): Promise<boolean> {
  const dlg = document.getElementById('admConfirm') as HTMLDialogElement;
  dlg.querySelector('p')!.textContent = text;
  const ok = dlg.querySelector<HTMLButtonElement>('[data-yes]')!;
  ok.textContent = yes;
  dlg.showModal();
  return new Promise((done) => dlg.addEventListener('close', () => done(dlg.returnValue === 'yes'), { once: true }));
}
