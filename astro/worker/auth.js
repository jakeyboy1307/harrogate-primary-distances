// Who is allowed into /admin and /api/admin/*. Cloudflare Access sits in front and asks for a one-time code
// by email; this file then checks, inside the Worker, that Access really approved the request and that the
// email is on the ADMIN_EMAILS list (wrangler.jsonc). Anything else is refused, so if Access is ever switched
// off or misconfigured, the admin closes rather than opens.
//
// Two ways to read the identity, whichever Cloudflare provides:
//   1. ctx.access: set by Cloudflare when Access approved the request (undefined otherwise).
//   2. The Cf-Access-Jwt-Assertion header, a token signed by Access. Checked against the team's public keys
//      when ACCESS_TEAM_DOMAIN (e.g. https://yourteam.cloudflareaccess.com) and ACCESS_AUD (the application's
//      Audience Tag, comma-separated if more than one) are set.

const allowed = (env, email) =>
  !!email && (env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());

// Access's public keys, kept for an hour
let keys = { at: 0, list: [] };
async function publicKeys(team) {
  if (Date.now() - keys.at < 3600e3 && keys.list.length) return keys.list;
  const r = await fetch(`${team}/cdn-cgi/access/certs`);
  if (!r.ok) throw new Error(`certs ${r.status}`);
  keys = { at: Date.now(), list: (await r.json()).keys ?? [] };
  return keys.list;
}

const b64url = (s) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(s.length / 4) * 4, '=')), (c) => c.charCodeAt(0));
const text = (s) => new TextDecoder().decode(b64url(s));

async function fromToken(request, env) {
  const team = (env.ACCESS_TEAM_DOMAIN || '').replace(/\/$/, '');
  const auds = (env.ACCESS_AUD || '').split(',').map((s) => s.trim()).filter(Boolean);
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!team || !auds.length || !token) return null;
  const [h, p, sig] = token.split('.');
  if (!h || !p || !sig) return null;
  const head = JSON.parse(text(h)), claims = JSON.parse(text(p));
  if (head.alg !== 'RS256') return null;
  const jwk = (await publicKeys(team)).find((k) => k.kid === head.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64url(sig), new TextEncoder().encode(`${h}.${p}`));
  const now = Date.now() / 1000;
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!ok || claims.iss !== team || !aud.some((a) => auds.includes(a)) || !(claims.exp > now) || (claims.nbf && claims.nbf > now + 60)) return null;
  return claims.email ?? null;
}

// The signed-in admin's email, or null if this request isn't from an allowed admin
export async function adminEmail(request, env, ctx) {
  let email = null;
  try {
    if (ctx?.access) email = (await ctx.access.getIdentity())?.email ?? null;
    if (!email) email = await fromToken(request, env);
  } catch (e) {
    console.error('admin auth', e);
    return null;
  }
  return allowed(env, email) ? email : null;
}
