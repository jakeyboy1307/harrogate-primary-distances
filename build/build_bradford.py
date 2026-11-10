"""Build the Bradford school data, in the same shape as build_data.py's North Yorkshire file.

Usage:  python3 -I build/build_bradford.py <raw-dir> <ny-raw-dir> <out.json>

<raw-dir> holds build/fetch_bradford.sh's gias.csv; <ny-raw-dir> holds build/fetch.sh's national files (ofsted.csv,
ofsted2019.csv, dfe-offers.csv). The priority areas come from build/bradford/priority-areas.geojson
(build/bradford_maps.py). Needs shapely and pyproj.

Most Bradford primary schools give places to children in care, then brothers and sisters, then the children who live
nearest, in a straight line: no catchment. Thirteen have a priority area, published as a map each; twelve of those
maps carry coordinates, so the checker can tell families whether they're in one, and St Joseph's, Bingley's is a
picture, so it's marked as an area the checker can't check.

Who got in comes from the council's parents' guides (build/bradford/allocations.json, build/bradford_guide.py): for
2026 and 2023, each school's applications considered, places, places by rule and the furthest distance offered. The
guides with 2024's and 2025's figures are no longer online, so those years are the DfE's first-choice figures, as is
any year where a full school's guide entry gives no distance. A full school reads:
- places by distance, no priority area: brothers and sisters, then others within that distance ("near");
- places by distance at a priority-area school: everyone in the area, plus others within it ("out");
- the last places in the priority area: only children in it, to that distance ("in");
- the last places on faith grounds: by the school's own rules, to that distance ("crit").
"""
import datetime, json, os, re, sys
from shapely.geometry import Point, shape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # common.py, which isolated mode (-I) won't find on its own
from common import DFE_SRC, OWN_RULES, firsts_year, kind, ofsted, read_dfe, read_mi, register_schools, successors

RAW, NY, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
HERE = os.path.dirname(os.path.abspath(__file__))
YEARS = (2026, 2025, 2024, 2023)
GUIDE_SRC = 'https://www.bradford.gov.uk/media/dy1lr1hm/applying-for-a-primary-school-detailed-guide-for-september-2027.pdf'
LA, COUNCIL = '380', 'Bradford'
# Each priority area map's school, as a word that picks out its register name
PA_SCHOOL = {'Addingham': r'^Addingham Primary', 'Baildon CofE': r'^Baildon (Church|C\.?\s?of\s?E|CE)', 'Ben Rhydding': r'^Ben Rhydding',
             'Cottingley Village': r'^Cottingley Village', 'East Morton CofE': r'^East Morton', 'Eldwick': r'^Eldwick',
             'Long Lee': r'^Long Lee', 'Myrtle Park': r'^Myrtle Park', 'Oxenhope CofE': r'^Oxenhope', 'Sandal': r'^Sandal',
             'Silsden': r'^Silsden Primary', 'St Josephs Bingley': 3367,   # the register doesn't name its town
             'Victoria': r'^Victoria Primary'}
# School websites the register has wrong or lacks (build/check_websites.py, 10 November 2026): Bowling Park's own domain
# doesn't answer (its site is on Google Sites), Green Lane's and Westbourne's work only without www., Our Lady and St
# Brendan's has moved to its trust's address, Merlin Top's works only without www.
WEB = {2075: 'https://sites.google.com/bowlingpark.school/bowlingparkprimary', 2034: 'https://greenlane.bradford.sch.uk/', 2193: 'https://westbourne.bradford.sch.uk/', 3353: 'https://olsb.bcwcat.co.uk/', 2014: 'https://mta.northerneducationtrust.org/'}
# The register's locality where it's a street or estate rather than the part of the district
PLACE_FIX = {}
# Where the register gives only "Bradford", the school's council ward (build/bradford/wards.json, from postcodes.io),
# by its first name ("Bolton & Undercliffe" -> Bolton) or the better-known one
WARDS = json.load(open(f'{HERE}/bradford/wards.json'))
WARD_PLACE = {'City': 'Bradford city centre', 'Bingley West': 'Bingley', 'Bolton & Undercliffe': 'Undercliffe'}


def place_of(r, loc):
    if r['code'] in PLACE_FIX:
        return PLACE_FIX[r['code']]
    if loc and loc != 'Bradford':
        return loc
    ward = WARDS.get(r['postcode'])
    return WARD_PLACE.get(ward, ward.split(' & ')[0]) if ward else 'Bradford'


# Schools the DfE gives no constituency ("n/a"), by school number: the constituency they're in
CON_FIX = {}

mi, mi19 = read_mi(f'{NY}/ofsted.csv'), read_mi(f'{NY}/ofsted2019.csv')
dfe = read_dfe(f'{NY}/dfe-offers.csv', {COUNCIL})
taking = {u for u, d in dfe.items() if 2026 in d['years']}
PRED = successors(f'{RAW}/gias.csv', LA, taking)


# Earlier academy conversions: the DfE's older years are under the closed school with the same number
import csv
NUMBER, CLOSED = {}, {}
for r in csv.DictReader(open(f'{RAW}/gias.csv', encoding='cp1252')):
    if r['LA (code)'] != LA:
        continue
    NUMBER[r['URN']] = r['EstablishmentNumber']
    if r['EstablishmentStatus (name)'] == 'Closed' and r['CloseDate'][-4:] >= '2022':
        CLOSED.setdefault(r['EstablishmentNumber'], []).append(r['URN'])


def figs(urn):
    """The DfE's figures for a school, with its predecessors' years where it has none of its own."""
    years, con = {}, None
    for u in ([PRED[urn]['URN']] if urn in PRED else []) + CLOSED.get(NUMBER.get(urn, ''), []) + [urn]:
        d = dfe.get(u) or {}
        years.update(d.get('years', {}))
        con = d.get('con') or con
    return {'con': con, 'years': years}


reg = register_schools(f'{RAW}/gias.csv', LA, taking | set(PRED))
STREET = re.compile(r'\b(road|lane|street|avenue|grove|close|crescent|way|terrace|walk|drive|gardens|place|row)$|\d', re.I)

GUIDE = {int(y): rows for y, rows in json.load(open(f'{HERE}/bradford/allocations.json')).items()}
MI = 1609.344


def guide_rec(s, y, d):
    """A year from the council's guide, or None when it has no figures for the school that year."""
    pc = s['postcode'].replace(' ', '')
    t = next((r for r in GUIDE.get(y, []) if r['postcode'] == pc), None)
    if not t or not t['allocated']:
        return None
    rec = {'y': y, **{k: d[k] for k in ('a', 'f') if d.get(k) is not None}, 'o': t['allocated'], **({'p': t['pan']} if t['pan'] else {})}
    if t['considered'] <= t['allocated']:
        return {**rec, 's': 'all_offered'}   # everyone considered got a place
    if t['furthest'] is None:
        return None
    if s.get('cz'):
        g = 'out' if t['distance'] else 'in' if t['area'] else 'crit'
    else:
        g = 'near' if t['distance'] else 'crit'
    return {**rec, 's': 'distance', 'g': g, 'm': round(t['furthest'] * MI), 'mi': t['furthest']}


schools = []
for r in reg:
    loc = r['locality'] if r['locality'] and not STREET.search(r['locality']) else r['town'].title() if r['town'].isupper() else r['town']
    f = figs(r['urn'])
    con = f.get('con')
    s = {'dfe': r['code'], 'urn': r['urn'], 'name': re.sub(r'\s+-\s+a Catholic voluntary academy$', '', r['name'], flags=re.I),
         'place': place_of(r, loc), 'method': 'straight_line', 'll': r['ll'], 'postcode': r['postcode'],
         'addr': r['addr'], 'web': WEB.get(r['code'], r['web']), 'of': ofsted(mi.get(f'{LA}{r["code"]}'), mi19),
         'con': CON_FIX.get(r['code'], con if con and con != 'n/a' else None),
         'type': kind(r['kind'], r['faith'] if r['faith'] not in ('Does not apply', 'None') else None),
         'own': OWN_RULES(r['kind']), 'src': GUIDE_SRC, 'pan': None}
    s['years'] = f['years']   # the years are made once the priority areas are known (below)
    if not s['con']:
        print(f'  no constituency: {s["name"]} ({s["dfe"]}), {s["postcode"]}')
    schools.append(s)

# ---------- priority areas ----------
pa = json.load(open(f'{HERE}/bradford/priority-areas.geojson'))
owner = lambda key: [s for s in schools if (s['dfe'] == PA_SCHOOL[key] if isinstance(PA_SCHOOL[key], int) else re.search(PA_SCHOOL[key], s['name'], re.I))]
catch = []
for f in pa['features']:
    key = f['properties']['school']
    hit = owner(key)
    if len(hit) != 1:
        sys.exit(f'{key}: {len(hit)} schools match')
    s, g = hit[0], shape(f['geometry'])
    if not g.buffer(0.002).contains(Point(s['ll'][1], s['ll'][0])):
        print(f'  {s["name"]} is outside its own priority area')
    polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
    s['cz'] = [len(catch)]
    catch.append({'name': f'{s["name"]} priority area', 'p': [[[[round(y, 5), round(x, 5)] for x, y in ring.coords] for ring in [q.exterior, *q.interiors]] for q in polys]})
for key in pa['pictures']:
    hit = owner(key)
    if len(hit) != 1:
        sys.exit(f'{key}: {len(hit)} schools match')
    hit[0]['cu'] = True   # its priority area is published only as a picture

# ---------- who got in ----------
for s in schools:
    years = s.pop('years')
    s['d'] = [x for x in (guide_rec(s, y, years.get(y) or {}) or (firsts_year(y, years[y]) if y in years else None) for y in YEARS) if x]
    s['pan'] = next((t['pan'] for t in GUIDE[2026] if t['postcode'] == s['postcode'].replace(' ', '') and t['pan']), None)
    if len(s['d']) < len(YEARS):
        print(f'  {s["name"]} ({s["dfe"]}): only {[x["y"] for x in s["d"]]}')
matched = {t['postcode'] for s in schools for t in GUIDE[2026] if t['postcode'] == s['postcode'].replace(' ', '')}
print('  in the 2026 guide but not matched:', [t['name'] for t in GUIDE[2026] if t['postcode'] not in matched])

out = {'schools': sorted(schools, key=lambda s: s['name']), 'catch': catch,
       'sources': [{'year': y, 'url': GUIDE_SRC if y in GUIDE else DFE_SRC} for y in YEARS], 'updated': datetime.date.today().isoformat()}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(f'{len(schools)} schools, {len(catch)} priority areas, {sum(1 for s in schools if s.get("cu"))} that can\'t be checked, '
      f'{len(json.dumps(out, separators=(",", ":"))) // 1024} KB')
