// Receives the site's feedback form and emails it with Resend.
// Secrets and settings (see wrangler.toml and README.md):
//   RESEND_API_KEY   secret, from resend.com/api-keys
//   FEEDBACK_TO      where messages go
//   FEEDBACK_FROM    the sender; must be a domain verified in Resend, or onboarding@resend.dev for testing
//   ALLOWED_ORIGINS  comma-separated sites allowed to post, e.g. https://jakeyboy1307.github.io,http://localhost:4321

const json = (body, status, headers) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
    const cors = allowed.includes(origin)
      ? { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', Vary: 'Origin' }
      : {};

    if (request.method === 'OPTIONS') return new Response(null, { status: allowed.includes(origin) ? 204 : 403, headers: cors });
    if (request.method !== 'POST') return json({ error: 'method' }, 405, cors);
    if (!allowed.includes(origin)) return json({ error: 'origin' }, 403, cors);

    let body;
    try { body = await request.json(); } catch { return json({ error: 'json' }, 400, cors); }
    // the hidden "website" field is left empty by people; a filled one is a bot, so pretend it worked
    if (body.website) return json({ ok: true }, 200, cors);
    const message = String(body.message || '').trim().slice(0, 5000);
    const email = String(body.email || '').trim().slice(0, 200);
    const page = String(body.page || '').slice(0, 300);
    if (!message) return json({ error: 'message' }, 400, cors);

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: env.FEEDBACK_FROM || 'Yorkshire School Checker <onboarding@resend.dev>',
        to: [env.FEEDBACK_TO],
        reply_to: EMAIL_RE.test(email) ? email : undefined,
        subject: `Feedback: ${message.slice(0, 60).replace(/\s+/g, ' ')}${message.length > 60 ? '…' : ''}`,
        text: `${message}\n\nFrom: ${email || 'no email given'}\nPage: ${page}\nSite: ${origin}`,
        html: `<p style="white-space:pre-wrap">${esc(message)}</p><hr><p>From: ${esc(email || 'no email given')}<br>Page: ${esc(page)}<br>Site: ${esc(origin)}</p>`,
      }),
    });
    if (!r.ok) return json({ error: 'send', status: r.status }, 502, cors);
    return json({ ok: true }, 200, cors);
  },
};
