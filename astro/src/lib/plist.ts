// The ranked list of up to five schools: drag by the handle (mouse or touch), or focus a handle and use the arrow keys.
import Sortable from 'sortablejs';
import { esc, MAX_SHORT, type Mode, type School } from './engine';
import { getList, moveInList, ordinal, setList } from './store';
import { chip, distTxt, ICON, shortName } from './ui';

export interface PListOpts {
  el: HTMLOListElement;
  byDfe: (dfe: number) => School | undefined;
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

export function renderPList(o: PListOpts) {
  const list = getList();
  const mode = o.mode();
  const rows = list.map((dfe, i) => {
    const s = o.byDfe(dfe);
    if (!s) return '';
    const name = o.big ? s.name.replace(/,.*$/, '') : shortName(s.name);
    return `<li class="slot" data-dfe="${dfe}">
      <span class="slot-n" aria-hidden="true"></span>
      <div class="slot-card">
        <button type="button" class="handle" data-dfe="${dfe}" aria-label="${esc(ordinal(i + 1))} choice, ${esc(s.name)}. Drag, or use the up and down arrow keys, to move it">${ICON.grip}</button>
        <button type="button" class="slot-main" data-open="${dfe}"><span class="slot-name">${esc(name)}</span><span class="slot-sub">${esc(subLine(s))}</span></button>
        <span class="slot-chip">${s.result ? chip(s, mode, true) : ''}</span>
      </div></li>`;
  });
  const empties = Array.from({ length: list.length < MAX_SHORT ? 1 : 0 }, () =>
    `<li class="slot empty" aria-hidden="true"><span class="slot-n"></span><div class="slot-empty">${esc(o.emptyText)}</div></li>`);
  o.el.innerHTML = rows.join('') + empties.join('');
  renumber(o.el);
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

export function initPList(o: PListOpts) {
  Sortable.create(o.el, {
    handle: '.handle',
    draggable: '.slot:not(.empty)',
    animation: 160,
    delay: 120, delayOnTouchOnly: true,   // press and hold on phones, so the page still scrolls
    ghostClass: 'sortable-ghost',
    dragClass: 'sortable-drag',
    forceFallback: true, fallbackOnBody: true,
    onChange: () => renumber(o.el),
    onEnd: () => {
      const order = [...o.el.querySelectorAll<HTMLElement>('.slot:not(.empty)')].map((li) => +li.dataset.dfe!);
      setList(order);
    },
  });
  o.el.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-open]');
    const s = b && o.byDfe(+b.dataset.open!);
    if (s) o.onOpen(s);
  });
  o.el.addEventListener('keydown', (e) => {
    const h = (e.target as HTMLElement).closest<HTMLElement>('.handle');
    if (!h || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
    e.preventDefault();
    const dfe = +h.dataset.dfe!, i = getList().indexOf(dfe);
    moveInList(dfe, i + (e.key === 'ArrowUp' ? -1 : 1));
    requestAnimationFrame(() => o.el.querySelector<HTMLElement>(`.handle[data-dfe="${dfe}"]`)?.focus());
  });
}
