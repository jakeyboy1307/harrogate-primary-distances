// The ranked list of schools (as many as the family’s council form takes: five, or three in the East Riding): drag by the handle (mouse or touch), or focus a handle and use the arrow keys.
// Below it sit the backups, which can be dragged into the list (the 5th school swaps down) or moved in with a button.
import Sortable from 'sortablejs';
import { esc, type Mode, type School } from './engine';
import { getBackups, getList, moveInList, ordinal, promoteBackup, setListAndBackups, listMax } from './store';
import { chip, distTxt, ICON, shortName, toast } from './ui';

export interface PListOpts {
  el: HTMLOListElement;
  backups?: HTMLOListElement;   // inside a box that's hidden while there are no backups
  byUrn: (urn: number) => School | undefined;
  mode: () => Mode;
  onOpen: (s: School) => void;
  emptyText: string;
  big?: boolean;
}

const subLine = (s: School) => {
  const bits = [distTxt(s)];
  if (s.inC) bits.push('In your catchment');
  else if (s.own) bits.push('Own rules');
  else if (s.result?.yrs?.length) {
    const ok = s.result.yrs.filter((y) => y.v === 'in' || y.v === 'all').length;
    bits.push(`Got in ${ok} of ${s.result.yrs.length} years`);
  }
  return bits.filter(Boolean).join(' · ');
};

const card = (o: PListOpts, s: School, label: string, end: string) => `
      <span class="slot-n" aria-hidden="true"></span>
      <div class="slot-card">
        <button type="button" class="handle" data-urn="${s.urn}" aria-label="${esc(label)}">${ICON.grip}</button>
        <button type="button" class="slot-main" data-open="${s.urn}"><span class="slot-name">${esc(o.big ? s.name.replace(/,.*$/, '') : shortName(s.name))}</span><span class="slot-sub">${esc(subLine(s))}</span></button>
        <span class="slot-chip">${end}</span>
      </div>`;

export function renderPList(o: PListOpts) {
  const list = getList();
  const mode = o.mode();
  const rows = list.map((urn, i) => {
    const s = o.byUrn(urn);
    if (!s) return '';
    return `<li class="slot" data-urn="${urn}">${card(o, s, `${ordinal(i + 1)} choice, ${s.name}. Drag, or use the up and down arrow keys, to move it`, s.result ? chip(s, mode, true) : '')}</li>`;
  });
  const empties = Array.from({ length: list.length < listMax() ? 1 : 0 }, () =>
    `<li class="slot empty" aria-hidden="true"><span class="slot-n"></span><div class="slot-empty">${esc(o.emptyText)}</div></li>`);
  o.el.innerHTML = rows.join('') + empties.join('');
  renumber(o.el);
  if (o.backups) {
    const backups = getBackups().map((u) => o.byUrn(u)).filter((s): s is School => !!s);
    o.backups.innerHTML = backups.map((s) => `<li class="slot" data-urn="${s.urn}">${card(o, s, `Backup, ${s.name}. Drag it into your list to swap it in`,
      `<button type="button" class="btn btn-sm" data-promote="${s.urn}">Move in</button>`)}</li>`).join('');
    o.backups.parentElement!.hidden = !backups.length;
  }
}

// Number the slots by where they sit, so the numbers stay in place while a card is dragged past them
function renumber(el: HTMLElement) {
  let n = 0;
  for (const li of el.children as HTMLCollectionOf<HTMLElement>) {
    if (li.classList.contains('sortable-fallback') || getComputedStyle(li).display === 'none') continue;
    const num = li.querySelector('.slot-n');
    if (num) num.textContent = String(++n);
  }
}

const swapped = (down: number | null) => { if (down != null) toast(`Swapped in. Your old ${ordinal(listMax())} choice is now a backup.`); };

export function initPList(o: PListOpts) {
  const urns = (el: HTMLElement) => [...el.querySelectorAll<HTMLElement>('.slot:not(.empty)')].map((li) => +li.dataset.urn!);
  const options: Sortable.Options = {
    group: 'school-list',   // the list and the backups share one group, so schools drag between them
    handle: '.handle',
    draggable: '.slot:not(.empty)',
    animation: 160,
    delay: 120, delayOnTouchOnly: true,   // press and hold on phones, so the page still scrolls
    ghostClass: 'sortable-ghost',
    dragClass: 'sortable-drag',
    forceFallback: true, fallbackOnBody: true,
    onChange: () => renumber(o.el),
    // a school dragged from one list to the other is the one to keep where it landed
    onEnd: (e) => swapped(setListAndBackups(urns(o.el), o.backups ? urns(o.backups) : getBackups(), e.from !== e.to ? +e.item.dataset.urn! : undefined)),
  };
  Sortable.create(o.el, options);
  if (o.backups) Sortable.create(o.backups, options);

  for (const el of [o.el, o.backups]) el?.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const promote = t.closest<HTMLElement>('[data-promote]');
    if (promote) {
      const urn = +promote.dataset.promote!, down = promoteBackup(urn);
      toast(`Moved into your list as ${ordinal(getList().indexOf(urn) + 1)} choice` + (down != null ? `. Your old ${ordinal(listMax())} choice is now a backup` : ''));
      return;
    }
    const b = t.closest<HTMLElement>('[data-open]');
    const s = b && o.byUrn(+b.dataset.open!);
    if (s) o.onOpen(s);
  });
  o.el.addEventListener('keydown', (e) => {
    const h = (e.target as HTMLElement).closest<HTMLElement>('.handle');
    if (!h || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const urn = +h.dataset.urn!, i = getList().indexOf(urn);
    moveInList(urn, i + (e.key === 'ArrowUp' ? -1 : 1));
    requestAnimationFrame(() => o.el.querySelector<HTMLElement>(`.handle[data-urn="${urn}"]`)?.focus());
  });
}
