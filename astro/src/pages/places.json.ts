// The places the footer's "Find your town" box suggests (lib/places.ts): [name, address] pairs, fetched only when
// someone clicks into the box, so the list isn't in every page's HTML.
import { places } from '../lib/places';
import { url } from '../lib/url';

export function GET() {
  return new Response(JSON.stringify(places().map((p) => [p.name, url(p.page)])), { headers: { 'Content-Type': 'application/json' } });
}
