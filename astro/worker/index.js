// The site's Worker. Pages and files come straight from dist/ (the ASSETS binding); only /api/* runs this code.
// POST /api/enquiry: the advertising enquiry form on /advertise/, emailed with Cloudflare Email Service
// (the ENQUIRY binding in wrangler.jsonc). Sending needs Email Routing switched on for the domain and the
// destination address verified. Under `wrangler dev` nothing is sent: the email is logged to the console.

const FROM = 'enquiries@yorkshireschoolchecker.co.uk';
const TO = 'jake.adams1307@gmail.com';   // must match destination_address in wrangler.jsonc
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const clip = (v, n) => String(v ?? '').trim().slice(0, n);

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

  const lines = [
    `Name: ${f.name}`, `Business: ${f.business}`, `Email: ${f.email}`, `Phone: ${f.phone || 'not given'}`,
    `Type: ${f.type || 'not given'}`, `Area: ${f.area || 'not given'}`,
    `Interested in: ${f.slots.length ? f.slots.join(', ') : 'not sure yet'}`, '', f.message || '(no message)',
  ];
  try {
    await env.ENQUIRY.send({
      to: TO, from: FROM, replyTo: f.email,
      subject: `Advertising enquiry: ${f.business}`.replace(/[\r\n]+/g, ' ').slice(0, 150),
      text: lines.join('\n'),
    });
  } catch (e) {
    console.error('enquiry send failed', e);
    return json({ error: 'send' }, 502);
  }
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/enquiry') return enquiry(request, env);
    if (pathname.startsWith('/api/')) return json({ error: 'not found' }, 404);
    return env.ASSETS.fetch(request);
  },
};
