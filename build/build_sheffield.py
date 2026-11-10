"""Build the Sheffield school data, in the same shape as build_data.py's North Yorkshire file.

Usage:  python3 -I build/build_sheffield.py <raw-dir> <ny-raw-dir> <out.json>

<raw-dir> holds build/fetch_sheffield.sh's gias.csv and catchments.geojson; <ny-raw-dir> holds build/fetch.sh's national
files (ofsted.csv, ofsted2019.csv, dfe-offers.csv). Who got in at the full schools comes from
build/sheffield/allocations.json (build/sheffield_tables.py). Needs shapely and pyproj.

Sheffield's community schools, and the academies on the council's rules, give places to children in care, then children
in the catchment with an older brother or sister at the school, then other children in the catchment, then brothers
and sisters, then others, nearest first in a straight line. Every one has a catchment, from the council's open data;
church schools have none and their own rules.

Who got in, 2024 to 2026: for each school in the council's oversubscribed schools PDF, its places by rule, the last
child's distance and who was refused. A full school reads:
- "everyone in the catchment, plus others within X" when children from outside it got places ("out");
- "everyone in the catchment, plus brothers and sisters" when, from outside, only they did ("sib");
- "only children in the catchment, to X" when children in it were refused ("in").
Every other year (2023, schools that weren't full, and church schools, which the PDF only names) is the DfE's
first-choice figures: how many put the school first, and how many of them got it.
"""
import csv, datetime, json, os, re, sys
from shapely.geometry import Point, shape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # common.py, which isolated mode (-I) won't find on its own
from common import DFE_SRC, OWN_RULES, firsts_year, kind, ofsted, read_dfe, read_mi, register_schools, successors

RAW, NY, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
HERE = os.path.dirname(os.path.abspath(__file__))
YEARS = (2026, 2025, 2024, 2023)
LA, COUNCIL = '373', 'Sheffield'
PDF = 'https://www.sheffield.gov.uk/sites/default/files/{y}-04/oversubscribed_infant_and_primary_schools_{y}.pdf'
MI = 1609.344
# School websites the register has wrong or lacks (build/check_websites.py, 10 November 2026): Sharrow's has moved; the
# others aren't listed (St Patrick's and Brigantia Hill Fort under their new numbers)
WEB = {2369: 'https://sharrowschool.co.uk/', 2059: 'https://www.st-patricks.sheffield.sch.uk/', 4005: 'https://www.oasisacademydonvalley.org/', 2054: 'https://brigantiahillfort.net/'}
# The register's locality where it's a street or estate rather than the part of the city
PLACE_FIX = {2051: 'Norfolk Park'}   # its ward is Park and Arbourthorne
# Where the register gives only "Sheffield", the school's council ward (build/sheffield/wards.json, from postcodes.io): the
# part of a two-part ward named in the school's name ("Totley Primary" in Dore and Totley), else its first part
WARDS = json.load(open(f'{HERE}/sheffield/wards.json'))
WARD_PLACE = {'City': 'Sheffield city centre', 'East Ecclesfield': 'Ecclesfield', 'West Ecclesfield': 'Ecclesfield', 'Manor Castle': 'Manor'}
# Catchments whose name doesn't come down to the register's: the school's number
CATCH_SCHOOL = {'Pathways E-Act Primary Academy': 2016, 'Lowedges Junior Academy': 2029}   # E-ACT Pathways Academy; Lowedges is now a primary
# Academies whose DfE figures before conversion are under a closed school with a different number: the old school's URN
OLD_URN = {'149575': '107066',   # Bankwood Primary School (Bankwood Community Primary School)
           '152375': '139347',   # St Patrick's Catholic Voluntary Academy, renumbered on 1 November 2026
           '152104': '140610'}   # Brigantia Hill Fort Academy: Wincobank Nursery and Infant Academy and Concord Junior, merged in 2025


def place_of(r, loc, name):
    if r['code'] in PLACE_FIX:
        return PLACE_FIX[r['code']]
    if loc and len(loc) > 3 and not loc.startswith('Sheffield'):
        return loc
    ward = WARDS.get(r['postcode'])
    if not ward:
        return 'Sheffield'
    if ward in WARD_PLACE:
        return WARD_PLACE[ward]
    parts = re.split(r' and | & ', ward)
    return next((p for p in parts if p.split()[0].lower() in name.lower()), parts[0])


mi, mi19 = read_mi(f'{NY}/ofsted.csv'), read_mi(f'{NY}/ofsted2019.csv')
dfe = read_dfe(f'{NY}/dfe-offers.csv', {COUNCIL})
taking = {u for u, d in dfe.items() if 2026 in d['years']}
PRED = successors(f'{RAW}/gias.csv', LA, taking)
# Earlier academy conversions: the DfE's older years are under the closed school with the same number
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
    for u in ([PRED[urn]['URN']] if urn in PRED else []) + ([OLD_URN[urn]] if urn in OLD_URN else []) + CLOSED.get(NUMBER.get(urn, ''), []) + [urn]:
        d = dfe.get(u) or {}
        years.update(d.get('years', {}))
        con = d.get('con') or con
    return {'con': con, 'years': years}


reg = register_schools(f'{RAW}/gias.csv', LA, taking | set(PRED) | set(OLD_URN))
STREET = re.compile(r'\b(road|lane|street|avenue|grove|close|crescent|way|terrace|walk|drive|gardens|place|row)$|\d', re.I)
letters = lambda n: re.sub(r'[^a-z]', '', n.lower().replace('’', "'").replace("'", ''))
CHURCH = re.compile(r'\b(St|Saint|All Saints|Catholic|Church of England|CofE|C of E|CE)\b')
TYPE_WORDS = r'\b(Nursery|and|Community|Primary|Infants?|Junior|Academy|School|Schools|Nurseries)\b'
norm = lambda n: letters(re.sub(TYPE_WORDS, ' ', re.sub(r'\s+I$', '', n)))   # "Holt House I": cut off in its cell


def school_named(n):
    """The one school a catchment or PDF name means: its name starts the same once type words are dropped, an exact
    match first, then a school without a church name ("Totley", not Totley All Saints)."""
    hit = [s for s in schools if norm(s['name']).startswith(norm(n))]
    if len(hit) > 1:
        hit = [s for s in hit if norm(s['name']) == norm(n)] or [s for s in hit if not CHURCH.search(s['name'])] or hit
    return hit

schools = []
for r in reg:
    loc = r['locality'] if r['locality'] and not STREET.search(r['locality']) else r['town'].title() if r['town'].isupper() else r['town']
    f = figs(r['urn'])
    name = re.sub(r'\s+-\s+a Catholic voluntary academy$', '', r['name'], flags=re.I)
    s = {'dfe': r['code'], 'urn': r['urn'], 'name': name, 'place': place_of(r, loc, name), 'method': 'straight_line', 'll': r['ll'],
         'postcode': r['postcode'], 'addr': r['addr'], 'web': WEB.get(r['code'], r['web']), 'of': ofsted(mi.get(f'{LA}{r["code"]}'), mi19),
         'con': f['con'] if f['con'] and f['con'] != 'n/a' else None,
         'type': kind(r['kind'], r['faith'] if r['faith'] not in ('Does not apply', 'None') else None),
         'own': OWN_RULES(r['kind']), 'src': PDF.format(y=2026), 'pan': None}
    s['years'] = f['years']
    if not s['con']:
        print(f'  no constituency: {s["name"]} ({s["dfe"]}), {s["postcode"]}')
    schools.append(s)

# ---------- catchments ----------
catch = []
for f in json.load(open(f'{RAW}/catchments.geojson'))['features']:
    title = f['properties']['catchment']
    # "Dobcroft Infant School & Dobcroft Junior School": the infant school takes Reception
    first = re.sub(r'\s*\((Primary phase)\)', '', title.split(' & ')[0])
    hit = [s for s in schools if s['dfe'] == CATCH_SCHOOL[title]] if title in CATCH_SCHOOL else school_named(first)
    if len(hit) != 1:
        print(f'  catchment {title!r}: {len(hit)} schools match {[s["name"] for s in hit]}')
        continue
    s, g = hit[0], shape(f['geometry']).buffer(0)
    if not g.buffer(0.002).contains(Point(s['ll'][1], s['ll'][0])):
        print(f'  {s["name"]} is outside its own catchment')
    polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
    s.setdefault('cz', []).append(len(catch))
    catch.append({'name': f'{first} catchment', 'p': [[[[round(y, 5), round(x, 5)] for x, y in ring.coords] for ring in [q.exterior, *q.interiors]] for q in polys]})

# ---------- who got in ----------
tables = {int(y): v for y, v in json.load(open(f'{HERE}/sheffield/allocations.json')).items()}


ROWS = {}   # (year, URN) -> the school's PDF row
for y, v in tables.items():
    for t in v['schools']:
        hit = school_named(t['name'])
        if len(hit) != 1:
            print(f'  {y} PDF row {t["name"]!r}: {len(hit)} schools {[s["name"] for s in hit]}')
            continue
        ROWS[(y, hit[0]['urn'])] = t
pdf_row = lambda s, y: ROWS.get((y, s['urn']))


def year_rec(s, y, d):
    t = pdf_row(s, y)
    if not t:
        return firsts_year(y, d) if d else None
    rec = {'y': y, **{k: d[k] for k in ('a', 'f') if d.get(k) is not None}, 'o': t['total'], 'p': t['places']}
    m = round(t['dist'] * MI)
    if t['ref_cm']:
        g = 'in'      # children in the catchment were refused: only they got places, to the last distance
    elif t['other']:
        g = 'out' if s.get('cz') else 'near'   # children from outside it got places, up to the last distance
    elif t['sib']:
        return {**rec, 's': 'distance', 'g': 'sib'}   # from outside, only brothers and sisters
    else:
        g = 'in'
    return {**rec, 's': 'distance', 'g': g, 'm': m, 'mi': t['dist']}


for s in schools:
    years = s.pop('years')
    s['d'] = [x for x in (year_rec(s, y, years.get(y)) for y in YEARS) if x]
    s['pan'] = next((pdf_row(s, y)['places'] for y in (2026, 2025, 2024) if pdf_row(s, y)), None)
    if len(s['d']) < len(YEARS):
        print(f'  {s["name"]} ({s["dfe"]}): only {[x["y"] for x in s["d"]]}')
none = [s['name'] for s in schools if 'cz' not in s and not CHURCH.search(s['name'])]
print('  no catchment, not a church school:', none)

out = {'schools': sorted(schools, key=lambda s: s['name']), 'catch': catch,
       'sources': [{'year': y, 'url': PDF.format(y=y) if y in tables else DFE_SRC} for y in YEARS], 'updated': datetime.date.today().isoformat()}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(f'{len(schools)} schools, {len(catch)} catchments, {len(json.dumps(out, separators=(",", ":"))) // 1024} KB')
