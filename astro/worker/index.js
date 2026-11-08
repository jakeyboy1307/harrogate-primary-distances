// The site's Worker. Pages and files come straight from dist/ (the ASSETS binding); only /api/* runs this code.
//   GET  /api/sponsors  the ads running today, for the ad slots on the site (from the DB binding, a D1 database)
//   POST /api/enquiry   the advertising enquiry form on /advertise/: saved to the database, then emailed with
//                       Cloudflare Email Service (the ENQUIRY binding). Under `wrangler dev` nothing is sent.
// The live site and previews use separate databases (see wrangler.jsonc), so preview data never shows live.

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

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    try {
      if (pathname === '/api/sponsors' && request.method === 'GET') return await sponsors(env);
      if (pathname === '/api/enquiry') return await enquiry(request, env);
    } catch (e) {
      console.error(pathname, e);
      return json({ error: 'server' }, 500);
    }
    if (pathname.startsWith('/api/')) return json({ error: 'not found' }, 404);
    return env.ASSETS.fetch(request);
  },
};
