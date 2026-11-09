// The admin API, behind the sign-in check in index.js. Everything is JSON.
//   GET    /api/admin/ads                list, with advertiser names and whether each is showing today
//   GET    /api/admin/ads/:id
//   POST   /api/admin/ads                create (saved as a draft unless status is given)
//   PUT    /api/admin/ads/:id            update every field
//   POST   /api/admin/ads/:id/status     { status: draft | live | paused | ended }
//   POST   /api/admin/ads/:id/duplicate  a draft copy
//   DELETE /api/admin/ads/:id
//   GET/POST /api/admin/advertisers, GET/PUT/DELETE /api/admin/advertisers/:id
//   GET    /api/admin/enquiries, PUT /api/admin/enquiries/:id { status }, POST /api/admin/enquiries/:id/convert
//   GET    /api/admin/spots              how full each ad spot is, per area
// An ad can only be live if it fits its spot: SPOTS[placement].limit ads at once per area (or per school),
// counting only live ads whose dates overlap.
import { AREAS, LIMITS, SPOTS } from '../src/lib/specs.ts';

const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());
const parse = (v) => { try { const a = JSON.parse(v ?? 'null'); return Array.isArray(a) ? a : null; } catch { return null; } };
const STATUSES = ['draft', 'live', 'paused', 'ended'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

class Bad extends Error { constructor(msg, status = 400) { super(msg); this.status = status; } }

// An ad row as the admin sees it
function shapeAd(r) {
  const day = today();
  const showing = r.status === 'live' && (!r.start_date || r.start_date <= day) && (!r.end_date || r.end_date >= day);
  return {
    id: r.id, advertiserId: r.advertiser_id, advertiser: r.advertiser_name ?? null, status: r.status,
    state: r.status !== 'live' ? r.status : showing ? 'showing' : r.start_date && r.start_date > day ? 'scheduled' : 'finished',
    placements: parse(r.placements) ?? [], areas: parse(r.areas) ?? [], urns: parse(r.urns),
    name: r.name, category: r.category, blurb: r.blurb, cta: r.cta, url: r.url,
    logoText: r.logo_text, logoUrl: r.logo_url, colour: r.colour, offer: r.offer, openDays: parse(r.open_days),
    start: r.start_date, end: r.end_date, pricePence: r.price_pence, pricePeriod: r.price_period, paid: !!r.paid,
    demo: !!r.demo, created: r.created_at, updated: r.updated_at,
  };
}

const str = (v, max, label, required = false) => {
  const s = String(v ?? '').trim();
  if (required && !s) throw new Bad(`${label} is needed.`);
  if (s.length > max) throw new Bad(`${label} is ${s.length} characters; the limit is ${max}.`);
  return s || null;
};

// Check and tidy an ad from the admin form. Throws Bad with a message the form can show.
function cleanAd(b) {
  const placements = [...new Set((b.placements ?? []).filter((p) => SPOTS[p]))];
  if (!placements.length) throw new Bad('Choose at least one ad spot.');
  const areas = [...new Set((b.areas ?? []).filter((a) => AREAS[a]))];
  if (!areas.length) throw new Bad('Choose at least one area.');
  const urns = Array.isArray(b.urns) && b.urns.length ? [...new Set(b.urns.map(Number).filter(Number.isInteger))] : null;
  if (placements.some((p) => SPOTS[p].needsSchools) && !urns) throw new Bad('A school profile needs the school (or schools) it belongs to.');
  let url = String(b.url ?? '').trim();
  if (!url) throw new Bad('Add the link the button opens.');
  if (!/^https?:\/\//i.test(url) && !url.startsWith('#')) url = 'https://' + url;
  if (!url.startsWith('#')) { try { const u = new URL(url); if (!/^https?:$/.test(u.protocol)) throw 0; } catch { throw new Bad('That link doesn’t look like a web address.'); } }
  const colour = String(b.colour ?? '').trim();
  if (colour && !/^#[0-9a-f]{6}$/i.test(colour)) throw new Bad('Colour should look like #2747D8.');
  for (const [k, label] of [['start', 'Start date'], ['end', 'End date']]) if (b[k] && !DATE.test(b[k])) throw new Bad(`${label} should be a date.`);
  if (b.start && b.end && b.start > b.end) throw new Bad('The end date is before the start date.');
  const openDays = (Array.isArray(b.openDays) ? b.openDays : []).map((d) => String(d).trim()).filter(Boolean);
  if (openDays.length > LIMITS.openDays) throw new Bad(`Up to ${LIMITS.openDays} open days.`);
  openDays.forEach((d) => { if (d.length > LIMITS.openDay) throw new Bad(`Open day “${d}” is over ${LIMITS.openDay} characters.`); });
  const price = b.pricePence === '' || b.pricePence == null ? null : Math.round(Number(b.pricePence));
  if (price != null && (!Number.isFinite(price) || price < 0)) throw new Bad('Price should be a positive number.');
  return {
    advertiser_id: b.advertiserId ? Number(b.advertiserId) : null,
    placements: JSON.stringify(placements), areas: JSON.stringify(areas), urns: urns ? JSON.stringify(urns) : null,
    name: str(b.name, LIMITS.name, 'Business name', true), category: str(b.category, LIMITS.category, 'Category', true),
    blurb: str(b.blurb, LIMITS.blurb, 'Description', true), cta: str(b.cta, LIMITS.cta, 'Button text', true), url,
    logo_text: str(b.logoText, LIMITS.logoText, 'Logo letters'), logo_url: str(b.logoUrl, 500, 'Logo link'),
    colour: colour || null, offer: str(b.offer, LIMITS.offer, 'Offer'), open_days: openDays.length ? JSON.stringify(openDays) : null,
    start_date: b.start || null, end_date: b.end || null, price_pence: price,
    price_period: ['month', 'year', 'once'].includes(b.pricePeriod) ? b.pricePeriod : null, paid: b.paid ? 1 : 0,
  };
}

// Would this ad, if live, put a spot over its limit? Returns a message, or null if it fits.
async function clash(env, ad, id) {
  const { results } = await env.DB.prepare(
    `SELECT id, name, placements, areas, urns, start_date, end_date FROM ads WHERE status = 'live' AND id != ?`,
  ).bind(id ?? -1).all();
  const mine = { placements: parse(ad.placements), areas: parse(ad.areas), urns: parse(ad.urns) };
  const overlaps = (o) => (!ad.end_date || !o.start_date || o.start_date <= ad.end_date) && (!o.end_date || !ad.start_date || o.end_date >= ad.start_date);
  for (const p of mine.placements) {
    const spot = SPOTS[p];
    for (const a of mine.areas) {
      const others = results.filter((o) => parse(o.placements)?.includes(p) && parse(o.areas)?.includes(a) && overlaps(o));
      if (spot.perSchool) {
        // per school: two ads naming the same school clash, and so do two covering every school in the area.
        // One naming schools can run alongside an area-wide one: on its schools the named one wins.
        const hit = others.filter((o) => {
          const u = parse(o.urns);
          return !u && !mine.urns ? true : u && mine.urns ? u.some((x) => mine.urns.includes(x)) : false;
        });
        if (hit.length >= spot.limit) return `${spot.label} in ${AREAS[a]} is already taken by ${hit.map((o) => o.name).join(', ')} for those dates, ${mine.urns ? 'on the same school' : 'across every school'}.`;
      } else if (others.length >= spot.limit) {
        return `${spot.label} in ${AREAS[a]} is full for those dates (${spot.limit} at once): ${others.map((o) => o.name).join(', ')}.`;
      }
    }
  }
  return null;
}

const getAd = (env, id) => env.DB.prepare(
  'SELECT ads.*, advertisers.name AS advertiser_name FROM ads LEFT JOIN advertisers ON advertisers.id = ads.advertiser_id WHERE ads.id = ?',
).bind(id).first();

async function ads(request, env, parts) {
  const m = request.method, id = parts[0] ? Number(parts[0]) : null;
  if (!id && m === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT ads.*, advertisers.name AS advertiser_name FROM ads LEFT JOIN advertisers ON advertisers.id = ads.advertiser_id ORDER BY ads.updated_at DESC, ads.id DESC',
    ).all();
    return results.map(shapeAd);
  }
  if (!id && m === 'POST') {
    const b = await request.json(), ad = cleanAd(b);
    const status = STATUSES.includes(b.status) ? b.status : 'draft';
    if (status === 'live') { const c = await clash(env, ad, null); if (c) throw new Bad(c, 409); }
    const cols = Object.keys(ad);
    const r = await env.DB.prepare(`INSERT INTO ads (${cols.join(', ')}, status) VALUES (${cols.map(() => '?').join(', ')}, ?) RETURNING id`)
      .bind(...Object.values(ad), status).first();
    return shapeAd(await getAd(env, r.id));
  }
  if (!id) throw new Bad('Not found', 404);
  const row = await getAd(env, id);
  if (!row) throw new Bad('That ad doesn’t exist.', 404);
  if (!parts[1] && m === 'GET') return shapeAd(row);
  if (!parts[1] && m === 'PUT') {
    const ad = cleanAd(await request.json());
    if (row.status === 'live') { const c = await clash(env, ad, id); if (c) throw new Bad(c, 409); }
    const cols = Object.keys(ad);
    await env.DB.prepare(`UPDATE ads SET ${cols.map((c) => `${c} = ?`).join(', ')}, updated_at = datetime('now') WHERE id = ?`)
      .bind(...Object.values(ad), id).run();
    return shapeAd(await getAd(env, id));
  }
  if (!parts[1] && m === 'DELETE') { await env.DB.prepare('DELETE FROM ads WHERE id = ?').bind(id).run(); return { ok: true }; }
  if (parts[1] === 'status' && m === 'POST') {
    const { status } = await request.json();
    if (!STATUSES.includes(status)) throw new Bad('Unknown status.');
    if (status === 'live') { const c = await clash(env, row, id); if (c) throw new Bad(c, 409); }
    await env.DB.prepare(`UPDATE ads SET status = ?, updated_at = datetime('now') WHERE id = ?`).bind(status, id).run();
    return shapeAd(await getAd(env, id));
  }
  if (parts[1] === 'duplicate' && m === 'POST') {
    const r = await env.DB.prepare(
      `INSERT INTO ads (advertiser_id, status, placements, areas, urns, name, category, blurb, cta, url, logo_text, logo_url, colour, offer, open_days, start_date, end_date, price_pence, price_period, paid, demo)
       SELECT advertiser_id, 'draft', placements, areas, urns, name, category, blurb, cta, url, logo_text, logo_url, colour, offer, open_days, start_date, end_date, price_pence, price_period, 0, demo
       FROM ads WHERE id = ? RETURNING id`,
    ).bind(id).first();
    return shapeAd(await getAd(env, r.id));
  }
  throw new Bad('Not found', 404);
}

const shapeAdvertiser = (r) => ({
  id: r.id, name: r.name, contactName: r.contact_name, email: r.email, phone: r.phone, notes: r.notes, demo: !!r.demo,
  created: r.created_at, ads: r.ads ?? 0, live: r.live ?? 0, bookedPence: r.booked ?? 0,
});
function cleanAdvertiser(b) {
  const email = str(b.email, 200, 'Email');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Bad('That email doesn’t look right.');
  return {
    name: str(b.name, 160, 'Business name', true), contact_name: str(b.contactName, 120, 'Contact name'),
    email, phone: str(b.phone, 40, 'Phone'), notes: str(b.notes, 4000, 'Notes'),
  };
}

async function advertisers(request, env, parts) {
  const m = request.method, id = parts[0] ? Number(parts[0]) : null;
  if (!id && m === 'GET') {
    const { results } = await env.DB.prepare(
      `SELECT advertisers.*, count(ads.id) AS ads, sum(ads.status = 'live') AS live,
              sum(CASE WHEN ads.status IN ('live', 'ended') THEN ads.price_pence ELSE 0 END) AS booked
       FROM advertisers LEFT JOIN ads ON ads.advertiser_id = advertisers.id GROUP BY advertisers.id ORDER BY advertisers.name COLLATE NOCASE`,
    ).all();
    return results.map(shapeAdvertiser);
  }
  if (!id && m === 'POST') {
    const a = cleanAdvertiser(await request.json());
    const r = await env.DB.prepare('INSERT INTO advertisers (name, contact_name, email, phone, notes) VALUES (?, ?, ?, ?, ?) RETURNING *')
      .bind(a.name, a.contact_name, a.email, a.phone, a.notes).first();
    return shapeAdvertiser(r);
  }
  if (!id) throw new Bad('Not found', 404);
  if (m === 'GET') {
    const r = await env.DB.prepare('SELECT * FROM advertisers WHERE id = ?').bind(id).first();
    if (!r) throw new Bad('That advertiser doesn’t exist.', 404);
    return shapeAdvertiser(r);
  }
  if (m === 'PUT') {
    const a = cleanAdvertiser(await request.json());
    const r = await env.DB.prepare('UPDATE advertisers SET name = ?, contact_name = ?, email = ?, phone = ?, notes = ? WHERE id = ? RETURNING *')
      .bind(a.name, a.contact_name, a.email, a.phone, a.notes, id).first();
    return shapeAdvertiser(r);
  }
  if (m === 'DELETE') {
    const n = await env.DB.prepare('SELECT count(*) AS n FROM ads WHERE advertiser_id = ?').bind(id).first();
    if (n.n) throw new Bad('This advertiser still has ads. Delete or move those first.', 409);
    await env.DB.prepare('UPDATE enquiries SET advertiser_id = NULL WHERE advertiser_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM advertisers WHERE id = ?').bind(id).run();
    return { ok: true };
  }
  throw new Bad('Not found', 404);
}

async function enquiries(request, env, parts) {
  const m = request.method, id = parts[0] ? Number(parts[0]) : null;
  if (!id && m === 'GET') {
    const { results } = await env.DB.prepare('SELECT * FROM enquiries ORDER BY created_at DESC, id DESC').all();
    return results.map((r) => ({ ...r, slots: parse(r.slots) ?? [], emailed: !!r.emailed }));
  }
  if (!id) throw new Bad('Not found', 404);
  const row = await env.DB.prepare('SELECT * FROM enquiries WHERE id = ?').bind(id).first();
  if (!row) throw new Bad('That enquiry doesn’t exist.', 404);
  if (!parts[1] && m === 'PUT') {
    const { status } = await request.json();
    if (!['new', 'replied', 'won', 'lost'].includes(status)) throw new Bad('Unknown status.');
    await env.DB.prepare('UPDATE enquiries SET status = ? WHERE id = ?').bind(status, id).run();
    return { ok: true };
  }
  if (!parts[1] && m === 'DELETE') { await env.DB.prepare('DELETE FROM enquiries WHERE id = ?').bind(id).run(); return { ok: true }; }
  if (parts[1] === 'convert' && m === 'POST') {
    if (row.advertiser_id) return { advertiserId: row.advertiser_id };
    const notes = [row.type && `Type: ${row.type}`, row.area && `Area: ${row.area}`, parse(row.slots)?.length && `Interested in: ${parse(row.slots).join(', ')}`, row.message]
      .filter(Boolean).join('\n');
    const a = await env.DB.prepare('INSERT INTO advertisers (name, contact_name, email, phone, notes) VALUES (?, ?, ?, ?, ?) RETURNING id')
      .bind(row.business, row.name, row.email, row.phone, notes || null).first();
    await env.DB.prepare(`UPDATE enquiries SET advertiser_id = ?, status = CASE WHEN status = 'new' THEN 'replied' ELSE status END WHERE id = ?`).bind(a.id, id).run();
    return { advertiserId: a.id };
  }
  throw new Bad('Not found', 404);
}

// How full each spot is in each area, today and over the next 30 days
async function spots(env) {
  const day = today();
  const { results } = await env.DB.prepare(`SELECT ads.*, advertisers.name AS advertiser_name FROM ads LEFT JOIN advertisers ON advertisers.id = ads.advertiser_id WHERE status = 'live'`).all();
  const live = results.map(shapeAd);
  const soon = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  return Object.entries(SPOTS).map(([p, spot]) => ({
    placement: p, ...spot,
    areas: Object.keys(AREAS).map((a) => {
      const here = live.filter((x) => x.placements.includes(p) && x.areas.includes(a));
      return {
        area: a,
        showing: here.filter((x) => x.state === 'showing').map((x) => ({ id: x.id, name: x.name, end: x.end, urns: x.urns, endingSoon: !!x.end && x.end <= soon })),
        scheduled: here.filter((x) => x.state === 'scheduled').map((x) => ({ id: x.id, name: x.name, start: x.start })),
      };
    }),
  }));
}

// GET /api/admin/stats?days=30: totals, a day-by-day series, top pages and schools, and ad performance
async function stats(env, url) {
  const days = Math.min(365, Math.max(1, Number(url.searchParams.get('days')) || 30));
  const end = today();
  const from = new Date(Date.parse(end + 'T12:00:00Z') - (days - 1) * 864e5).toISOString().slice(0, 10);
  const q = (sql, ...args) => env.DB.prepare(sql).bind(from, end, ...args).all().then((r) => r.results);
  const [totals, series, pages, searches, schools, adRows, ads] = await Promise.all([
    q('SELECT kind, sum(n) AS n FROM daily_counts WHERE day BETWEEN ? AND ? GROUP BY kind'),
    q(`SELECT day, sum(CASE WHEN kind = 'page' THEN n ELSE 0 END) AS pages, sum(CASE WHEN kind = 'search' THEN n ELSE 0 END) AS searches
       FROM daily_counts WHERE day BETWEEN ? AND ? AND kind IN ('page', 'search') GROUP BY day`),
    q(`SELECT key, sum(n) AS n FROM daily_counts WHERE day BETWEEN ? AND ? AND kind = 'page' GROUP BY key ORDER BY n DESC LIMIT 15`),
    q(`SELECT key, sum(n) AS n FROM daily_counts WHERE day BETWEEN ? AND ? AND kind = 'search' GROUP BY key ORDER BY n DESC`),
    q(`SELECT key, sum(n) AS n FROM daily_counts WHERE day BETWEEN ? AND ? AND kind = 'panel' GROUP BY key ORDER BY n DESC LIMIT 20`),
    q(`SELECT kind, key, sum(n) AS n FROM daily_counts WHERE day BETWEEN ? AND ? AND kind IN ('ad_view', 'ad_click') GROUP BY kind, key`),
    env.DB.prepare('SELECT ads.id, ads.name, ads.status, ads.advertiser_id, ads.demo, advertisers.name AS advertiser FROM ads LEFT JOIN advertisers ON advertisers.id = ads.advertiser_id').all().then((r) => r.results),
  ]);
  // every day in the range, including ones with nothing, so the chart has no gaps
  const byDay = new Map(series.map((r) => [r.day, r]));
  const daily = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.parse(from + 'T12:00:00Z') + i * 864e5).toISOString().slice(0, 10);
    return { day: d, pages: byDay.get(d)?.pages ?? 0, searches: byDay.get(d)?.searches ?? 0 };
  });
  // ad views and clicks, per ad and per spot
  const perAd = new Map();
  for (const r of adRows) {
    const [id, slot] = r.key.split(':');
    const a = perAd.get(id) ?? { id: Number(id), views: 0, clicks: 0, slots: {} };
    const s = (a.slots[slot] ??= { views: 0, clicks: 0 });
    if (r.kind === 'ad_view') { a.views += r.n; s.views += r.n; } else { a.clicks += r.n; s.clicks += r.n; }
    perAd.set(id, a);
  }
  const names = new Map(ads.map((a) => [String(a.id), a]));
  const adStats = [...perAd.values()].map((a) => {
    const info = names.get(String(a.id));
    return { ...a, name: info?.name ?? `Deleted ad ${a.id}`, advertiser: info?.advertiser ?? null, advertiserId: info?.advertiser_id ?? null, status: info?.status ?? 'deleted', demo: !!info?.demo };
  }).sort((x, y) => y.views - x.views);
  const total = Object.fromEntries(totals.map((r) => [r.kind, r.n]));
  return { from, to: end, days, total, daily, pages, searches, schools, ads: adStats };
}

export async function adminApi(request, env, pathname) {
  if (!env.DB) throw new Bad('The admin database isn’t connected.', 500);
  const [section, ...parts] = pathname.replace(/^\/api\/admin\//, '').split('/').filter(Boolean);
  try {
    if (section === 'ads') return { body: await ads(request, env, parts) };
    if (section === 'advertisers') return { body: await advertisers(request, env, parts) };
    if (section === 'enquiries') return { body: await enquiries(request, env, parts) };
    if (section === 'spots' && request.method === 'GET') return { body: await spots(env) };
    if (section === 'stats' && request.method === 'GET') return { body: await stats(env, new URL(request.url)) };
    return { status: 404, body: { error: 'Not found' } };
  } catch (e) {
    if (e instanceof Bad) return { status: e.status, body: { error: e.message } };
    if (e instanceof SyntaxError) return { status: 400, body: { error: 'That request wasn’t valid.' } };
    throw e;
  }
}
