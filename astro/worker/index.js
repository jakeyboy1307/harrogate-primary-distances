// The site's Worker. Pages and files come straight from dist/ (the ASSETS binding); only /api/* runs this code.
//   GET  /api/sponsors  the ads running today, for the ad slots on the site (from the DB binding, a D1 database)
//   POST /api/enquiry   the advertising enquiry form on /advertise/: saved to the database, then emailed with
//                       Cloudflare Email Service (the ENQUIRY binding). Under `wrangler dev` nothing is sent.
//   /admin, /api/admin/* only for a signed-in admin (worker/auth.js); everyone else gets "not allowed".
// The live site and previews use separate databases (see wrangler.jsonc), so preview data never shows live.

import { adminApi } from './admin.js';
import { adminEmail } from './auth.js';

const FROM = 'enquiries@yorkshireschoolchecker.co.uk';
const TO = 'jake.adams1307@gmail.com';   // must match destination_address in wrangler.jsonc
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers } });
const clip = (v, n) => String(v ?? '').trim().slice(0, n);
const list = (v) => { try { const a = JSON.parse(v ?? 'null'); return Array.isArray(a) ? a : null; } catch { return null; } };
// today as YYYY-MM-DD in UK time, to compare with the ads' start and end dates
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }).format(new Date());

async function sponsors(env) {
  if (!env.DB) return json([], 200);
  const day = today();
  const { results } = await env.DB.prepare(
    `SELECT * FROM ads WHERE status = 'live'
       AND (start_date IS NULL OR start_date <= ?1) AND (end_date IS NULL OR end_date >= ?1)
     ORDER BY id`,
  ).bind(day).all();
  const out = results.map((r) => ({
    id: String(r.id), name: r.name, category: r.category, blurb: r.blurb, cta: r.cta, url: r.url,
    placements: list(r.placements) ?? [], areas: list(r.areas) ?? [], urns: list(r.urns) ?? undefined,
    logo: r.logo_text ?? '', logoUrl: r.logo_url ?? undefined, colour: r.colour ?? '#14182B',
    offer: r.offer ?? undefined, openDays: list(r.open_days) ?? undefined,
    start: r.start_date ?? undefined, end: r.end_date ?? undefined, demo: !!r.demo,
  }));
  // a minute in the browser, so a change in the admin shows within about a minute
  return json(out, 200, { 'Cache-Control': 'public, max-age=60' });
}

// POST /api/hit: counts from the site's pages (src/lib/track.ts), added to daily totals. No cookies, no IP
// addresses, nothing about a person: just "this page was viewed n times today".
const SPOT_KEYS = 'uniform|profile|nearby|results|plan|area|pagesponsor';
const HIT_KEYS = {
  page: /^(404|\/[a-z0-9\-\/]{0,80})$/,
  search: /^(harrogate|york|outside)$/,
  panel: /^\d{5,7}$/,
  ad_view: new RegExp(`^\\d{1,9}:(${SPOT_KEYS})$`),
  ad_click: new RegExp(`^\\d{1,9}:(${SPOT_KEYS})$`),
};
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|preview|curl|wget|python|httpclient|monitor/i;

async function hit(request, env) {
  if (request.method !== 'POST') return new Response(null, { status: 405 });
  // only this site's own pages, and not robots
  const origin = request.headers.get('Origin');
  const same = origin ? origin === new URL(request.url).origin : request.headers.get('Sec-Fetch-Site') === 'same-origin';
  if (!same || BOT.test(request.headers.get('User-Agent') ?? '') || !env.DB) return new Response(null, { status: 204 });
  let body;
  try { body = JSON.parse((await request.text()).slice(0, 8000)); } catch { return new Response(null, { status: 400 }); }
  const events = (Array.isArray(body?.e) ? body.e : []).slice(0, 40).filter((x) =>
    Array.isArray(x) && HIT_KEYS[x[0]]?.test(String(x[1])) && Number.isInteger(x[2]) && x[2] > 0 && x[2] <= 20);
  if (!events.length) return new Response(null, { status: 204 });
  const day = today();
  const add = env.DB.prepare('INSERT INTO daily_counts (day, kind, key, n) VALUES (?, ?, ?, ?) ON CONFLICT (day, kind, key) DO UPDATE SET n = n + excluded.n');
  await env.DB.batch(events.map(([kind, key, n]) => add.bind(day, kind, String(key), n)));
  return new Response(null, { status: 204 });
}

async function enquiry(request, env) {
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  // only this site's own pages may post here
  const origin = request.headers.get('Origin');
  if (origin !== new URL(request.url).origin) return json({ error: 'origin' }, 403);
  let b;
  try { b = await request.json(); } catch { return json({ error: 'json' }, 400); }
  // the hidden "website" field is left empty by people; a filled one is a bot, so pretend it worked
  if (b.website) return json({ ok: true });

  const f = {
    name: clip(b.name, 120), business: clip(b.business, 160), email: clip(b.email, 200), phone: clip(b.phone, 40),
    type: clip(b.type, 80), area: clip(b.area, 40), message: clip(b.message, 4000),
    slots: (Array.isArray(b.slots) ? b.slots : []).map((s) => clip(s, 60)).slice(0, 10),
  };
  if (!f.name || !f.business || !EMAIL_RE.test(f.email)) return json({ error: 'fields' }, 400);

  // save it first, so no enquiry is lost if the email fails
  let id = null;
  if (env.DB) {
    try {
      const r = await env.DB.prepare(
        'INSERT INTO enquiries (name, business, email, phone, type, area, slots, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
      ).bind(f.name, f.business, f.email, f.phone || null, f.type || null, f.area || null, JSON.stringify(f.slots), f.message || null).first();
      id = r?.id ?? null;
    } catch (e) { console.error('enquiry save failed', e); }
  }

  const lines = [
    `Name: ${f.name}`, `Business: ${f.business}`, `Email: ${f.email}`, `Phone: ${f.phone || 'not given'}`,
    `Type: ${f.type || 'not given'}`, `Area: ${f.area || 'not given'}`,
    `Interested in: ${f.slots.length ? f.slots.join(', ') : 'not sure yet'}`, '', f.message || '(no message)',
  ];
  let emailed = false;
  try {
    await env.ENQUIRY.send({
      to: TO, from: FROM, replyTo: f.email,
      subject: `Advertising enquiry: ${f.business}`.replace(/[\r\n]+/g, ' ').slice(0, 150),
      text: lines.join('\n'),
    });
    emailed = true;
    if (id != null) await env.DB.prepare('UPDATE enquiries SET emailed = 1 WHERE id = ?').bind(id).run();
  } catch (e) {
    console.error('enquiry email failed', e);
  }
  // it counts as received if it was saved or emailed
  return id != null || emailed ? json({ ok: true }) : json({ error: 'send' }, 502);
}

// what anyone who isn't a signed-in admin sees at /admin
const DENIED = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>Not allowed</title>
<body style="font:17px/1.5 system-ui,sans-serif;max-width:520px;margin:15vh auto;padding:0 20px;color:#14182B">
<h1 style="font-size:28px">You can’t see this page</h1><p>This part of the site is for the people who run it.</p>
<p><a href="/">Back to the school checker</a></p></body>`;
const PRIVATE = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex', 'X-Frame-Options': 'DENY' };

async function admin(request, env, ctx, pathname) {
  const email = await adminEmail(request, env, ctx);
  if (pathname.startsWith('/api/admin/')) {
    if (!email) return json({ error: 'not allowed' }, 403, PRIVATE);
    if (pathname === '/api/admin/me') return json({ email, environment: env.ENVIRONMENT ?? 'unknown' }, 200, PRIVATE);
    if (pathname === '/api/admin/summary') {
      const day = today();
      const r = env.DB ? await env.DB.prepare(
        `SELECT
           (SELECT count(*) FROM ads WHERE status = 'live' AND (start_date IS NULL OR start_date <= ?1) AND (end_date IS NULL OR end_date >= ?1)) AS showing,
           (SELECT count(*) FROM ads) AS ads,
           (SELECT count(*) FROM advertisers) AS advertisers,
           (SELECT count(*) FROM enquiries WHERE status = 'new') AS new_enquiries,
           (SELECT count(*) FROM ads WHERE status = 'live' AND end_date BETWEEN ?1 AND date(?1, '+14 days')) AS ending_soon`,
      ).bind(day).first() : null;
      return json(r ?? {}, 200, PRIVATE);
    }
    const r = await adminApi(request, env, pathname);
    return json(r.body, r.status ?? 200, PRIVATE);
  }
  if (!email) return new Response(DENIED, { status: 403, headers: { 'Content-Type': 'text/html; charset=utf-8', ...PRIVATE } });
  const page = await env.ASSETS.fetch(request);
  const res = new Response(page.body, page);
  for (const [k, v] of Object.entries(PRIVATE)) res.headers.set(k, v);
  return res;
}

export default {
  async fetch(request, env, ctx) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/')) return await admin(request, env, ctx, pathname);
      if (pathname === '/api/sponsors' && request.method === 'GET') return await sponsors(env);
      if (pathname === '/api/enquiry') return await enquiry(request, env);
      if (pathname === '/api/hit') return await hit(request, env);
    } catch (e) {
      console.error(pathname, e);
      return json({ error: 'server' }, 500);
    }
    if (pathname.startsWith('/api/')) return json({ error: 'not found' }, 404);
    return env.ASSETS.fetch(request);
  },
};
