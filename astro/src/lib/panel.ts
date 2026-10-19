// Fills and drives the school slide-out panel shared by Find schools and My plan.
import {
  esc, fmt, headlineAnswer, mon, ofsted, plural, whoGotIn, yearVerdict, youText,
  MAX_SHORT, type LatLng, type Mode, type School,
} from './engine';
import { addToList, getList, onListChange, ordinal, rankOf, removeFromList } from './store';
import { $, chip, toast } from './ui';

interface Ctx { order: () => number[]; byId: (id: number) => School | undefined; mode: () => Mode; home: () => LatLng | null; onChangeOrder?: () => void }
let ctx: Ctx;
let current: number | null = null;
let lastFocus: HTMLElement | null = null;

const panel = () => $('#panel'), scrim = () => $('#scrim');

export function initPanel(c: Ctx) {
  ctx = c;
  $('#pClose').addEventListener('click', closePanel);
  scrim().addEventListener('click', closePanel);
  $('#pPrev').addEventListener('click', () => step(-1));
  $('#pNext').addEventListener('click', () => step(1));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && current != null) closePanel(); });
  $('#pFoot').addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!b || current == null) return;
    const s = ctx.byId(current)!;
    if (b.dataset.act === 'add') {
      const r = addToList(s.dfe);
      toast(r === 'full' ? 'Your list is full. Remove a school to add another.' : `Added as your ${ordinal(rankOf(s.dfe)!)} choice`);
    } else if (b.dataset.act === 'remove') {
      removeFromList(s.dfe); toast('Removed from your list');
    } else if (b.dataset.act === 'order') {
      closePanel(); ctx.onChangeOrder?.();
    }
  });
  onListChange(() => { if (current != null) renderFoot(ctx.byId(current)!); });
}

function step(d: number) {
  const ids = ctx.order(), i = ids.indexOf(current!);
  const next = ids[i + d];
  if (next != null) openPanel(next);
}

export function openPanel(id: number) {
  const s = ctx.byId(id);
  if (!s) return;
  if (current == null) lastFocus = document.activeElement as HTMLElement;
  current = id;
  $('#pBody').innerHTML = body(s, ctx.mode(), ctx.home());
  $('#pBody').scrollTop = 0;
  renderFoot(s);
  const ids = ctx.order(), i = ids.indexOf(id);
  $<HTMLButtonElement>('#pPrev').disabled = i <= 0;
  $<HTMLButtonElement>('#pNext').disabled = i < 0 || i >= ids.length - 1;
  $('#pPos').textContent = i >= 0 ? `${i + 1} of ${ids.length}` : '';
  const p = panel();
  scrim().hidden = false;
  p.removeAttribute('inert'); p.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => { scrim().classList.add('open'); p.classList.add('open'); });
  document.body.classList.add('panel-open');
  $('#pClose').focus({ preventScroll: true });
  document.dispatchEvent(new CustomEvent('panel:open', { detail: id }));
}

export function closePanel() {
  if (current == null) return;
  current = null;
  const p = panel();
  p.classList.remove('open'); scrim().classList.remove('open');
  p.setAttribute('aria-hidden', 'true'); p.setAttribute('inert', '');
  document.body.classList.remove('panel-open');
  setTimeout(() => { if (current == null) scrim().hidden = true; }, 250);
  lastFocus?.focus?.({ preventScroll: true });
  document.dispatchEvent(new CustomEvent('panel:close'));
}

function renderFoot(s: School) {
  const rank = rankOf(s.dfe), n = getList().length;
  $('#pFoot').innerHTML = rank
    ? `<div class="rank"><span class="rank-badge">${rank}</span><span>In your list as ${ordinal(rank)} choice</span></div>
       <div class="acts"><button type="button" class="btn btn-sm" data-act="remove">Remove</button><button type="button" class="btn btn-sm btn-dark" data-act="order">Change order</button></div>`
    : n >= MAX_SHORT
      ? `<div class="rank"><span>Your list already has ${MAX_SHORT} schools</span></div><div class="acts"><button type="button" class="btn btn-sm btn-dark" data-act="order">Change my list</button></div>`
      : `<div class="rank"><span>Not on your list yet</span></div><div class="acts"><button type="button" class="btn btn-sm btn-primary" data-act="add">Add as ${ordinal(n + 1)} choice</button></div>`;
}

// Phone and email for the school office, for questions about admissions or a visit
function contact(s: School) {
  if (!s.tel && !s.email) return '';
  const tel = s.tel ? `<a class="contact-link" href="tel:${s.tel.replace(/\s/g, '')}"><span>Phone</span><b>${esc(s.tel)}</b></a>` : '';
  const mail = s.email ? `<a class="contact-link" href="mailto:${esc(s.email)}?subject=${encodeURIComponent('Reception admissions')}"><span>Email</span><b>${esc(s.email)}</b></a>` : '';
  const ask = s.own ? 'Ask the office for its admissions policy, or to book a look round.' : 'Ask the office about admissions or to book a look round.';
  return `<section class="p-sec contact"><div class="p-sec-head"><h3>Get in touch</h3></div>
    <p class="p-note" style="padding:0 0 12px">${ask}${!s.email && s.web ? ' You’ll find their email on the school website.' : ''}</p>
    <div class="contact-links">${tel}${mail}</div></section>`;
}

function body(s: School, mode: Mode, home: LatLng | null) {
  const r = s.result;
  const of = ofsted(s.of);
  const last = s.d.find((x) => x.s === 'distance');
  const yours = s.used ?? s.straight;
  const cz = !s.cz ? `None${/Catholic/.test(s.type) ? ', faith school' : ''}` : s.inC == null ? 'Not checked' : s.inC ? 'You’re in it' : 'Outside it';
  const first = s.d.find((x) => x.f != null);
  const sg = s.of?.safeguarding;
  const policy = s.own
    ? `${/academy/i.test(s.type) ? 'As an academy it sets' : 'It sets'} its own admissions policy. Check it for any faith, feeder or other priorities before applying.`
    : 'Uses the council’s admissions policy: catchment first, then brothers and sisters, then distance.';
  const notes = [s.note, ...s.d.filter((x) => x.n).map((x) => `${x.y}: ${x.n}`)].filter(Boolean).map(esc).join('<br>');
  const links = [
    home ? `<a href="https://www.google.com/maps/dir/?api=1&origin=${home[0].toFixed(5)},${home[1].toFixed(5)}&destination=${s.ll[0]},${s.ll[1]}&travelmode=walking" target="_blank" rel="noopener">Walking directions</a>` : '',
    s.web ? `<a href="${esc(s.web)}" target="_blank" rel="noopener">School website</a>` : '',
    s.of ? `<a href="${esc(s.of.link)}" target="_blank" rel="noopener">Ofsted reports</a>` : '',
    `<a href="${esc(s.src)}" target="_blank" rel="noopener">Council figures</a>`,
  ].join('');

  const ofBlock = s.of?.areas?.length
    ? `<div class="p-sec-head"><h3>${s.of.kind === 'card' ? 'Ofsted report card' : 'Ofsted by area'}</h3><span>Inspected ${mon(s.of.date)}</span></div>
       <div class="of-chips">${s.of.areas.map((a) => `<span><b>${esc(a[0])}</b> · ${esc(a[1].replace(' standard', ''))}</span>`).join('')}${sg ? `<span><b>Safeguarding</b> · ${esc(sg)}</span>` : ''}</div>`
    : `<div class="p-sec-head"><h3>Ofsted</h3></div><div class="of-grade"><span class="of-badge of-${of.tone}">${esc(of.head)}</span><span>${esc(of.sub)}</span></div>`;

  return `
  <div class="p-head">${r ? chip(s, mode) : ''}<h2 id="pTitle">${esc(s.name)}</h2>
    <p class="p-sub">${esc(s.place)} · ${esc(s.type.charAt(0).toUpperCase() + s.type.slice(1))}${s.pan ? ` · ${s.pan} places a year` : ''}</p></div>
  ${r ? `<div class="answer"><h3>${esc(headlineAnswer(s, mode))}</h3><p>${esc(r.label)}.</p></div>` : ''}
  <dl class="facts">
    <div><dt>${s.method === 'walking' && s.walk != null ? 'Your walk' : 'Your distance'}</dt><dd>${yours != null ? fmt(yours) : 'n/a'}</dd></div>
    <div><dt>Catchment</dt><dd>${cz}</dd></div>
    <div><dt>${last ? 'Last place, ' + last.y : 'Last place'}</dt><dd>${last ? (last.g === 'sib' ? 'Siblings only' : fmt(last.m)) : 'Not published'}</dd></div>
    ${sg ? `<div><dt>Safeguarding</dt><dd class="${sg === 'Met' ? 'good' : 'bad'}">${esc(sg)}</dd></div>`
         : `<div><dt>Ofsted</dt><dd class="${of.tone === 'bad' ? 'bad' : of.tone === 'na' ? '' : 'good'}">${esc(of.short)}</dd></div>`}
  </dl>
  <section class="p-sec"><h3>Year by year</h3>
    <table class="tbl"><thead><tr><th>Year</th><th>Who got a place</th><th class="you">${r ? 'Would you get in?' : ''}</th></tr></thead><tbody>
    ${s.d.map((x) => { const yv = yearVerdict(x, s.used, s.inC); const v = yv.v === 'all' ? 'in' : yv.v;
      return `<tr><td class="yr">${x.y}</td><td>${esc(whoGotIn(x))}</td><td class="you">${r ? `<span class="chip chip-sm v-${v}">${esc(youText(yv))}</span>` : ''}</td></tr>`; }).join('')}
    </tbody></table></section>
  <section class="p-sec"><h3>How popular is it?</h3>
    <table class="tbl num"><thead><tr><th>Year</th><th>Applied</th><th>Places</th><th>Offered</th></tr></thead><tbody>
    ${s.d.map((x) => `<tr><td class="yr">${x.y}</td><td>${x.a ?? 'n/a'}</td><td>${x.p ?? 'n/a'}</td><td>${x.o ?? 'n/a'}</td></tr>`).join('')}
    </tbody></table>
    ${first ? `<p class="p-note">In ${first.y}, ${plural(first.f!, 'family', 'families')} put it as their first choice.${first.p && first.f! > first.p ? ' That’s more than it has places.' : ''}</p>` : ''}
  </section>
  <section class="p-sec">${ofBlock}</section>
  <div class="two"><div><h4>Admissions</h4><p>${policy}${notes ? '<br>' + notes : ''}</p></div>${s.addr ? `<div><h4>Address</h4><p>${esc(s.addr)}</p></div>` : ''}</div>
  ${contact(s)}
  <div class="links">${links}</div>
  ${s.walkErr && s.method === 'walking' ? '<p class="p-note">Distances here are straight lines, because the walking-route service didn’t respond.</p>' : ''}`;
}
