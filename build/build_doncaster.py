"""Build the Doncaster school data, in the same shape as build_data.py's North Yorkshire file.

Usage:  python3 -I build/build_doncaster.py <raw-dir> <ny-raw-dir> <out.json>

<raw-dir> holds build/fetch_doncaster.sh's gias.csv and catchments.geojson; <ny-raw-dir> holds build/fetch.sh's national
files (ofsted.csv, ofsted2019.csv, dfe-offers.csv). Needs shapely and pyproj.

Doncaster's community schools, and most academies, give places to children in care, then children in the catchment,
then brothers and sisters, then the children who live nearest, in a straight line. The catchments are the layer behind
the council's catchment finder, each named for its school and carrying its DfE number. Some areas are shared ("option
areas", named "Kirkby Avenue Primary School or Scawthorpe Sunnyfields Primary School"): a home there is in both schools'
catchments, so the area goes to both. "Unity Area TBC", a new estate without a school yet, goes to none.

The council publishes no cut-off distances (its guide gives each school's preferences agreed and refused, the same as the
DfE's figures), so every year is a DfE "firsts" record: how many put the school first, and how many of them got it.
"""
import csv, datetime, json, os, re, sys
from shapely.geometry import Point, shape
from shapely.ops import unary_union

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # common.py, which isolated mode (-I) won't find on its own
from common import DFE_SRC, OWN_RULES, firsts_year, kind, ofsted, read_dfe, read_mi, register_schools, successors

RAW, NY, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
HERE = os.path.dirname(os.path.abspath(__file__))
YEARS = (2026, 2025, 2024, 2023)
LA, COUNCIL = '371', 'Doncaster'
# School websites the register has wrong or lacks (build/check_websites.py, 11 November 2026): Canon Popham's has moved,
# and Orchard Infants' works only without www.
WEB = {3313: 'https://www.canonpopham.co.uk/', 2129: 'https://orchardinfants.wordpress.com/'}
# The register's locality where it's a street or estate rather than the village or part of the town
PLACE_FIX = {}
# Where the register gives only "Doncaster", the school's council ward (build/doncaster/wards.json, from postcodes.io)
WARDS = json.load(open(f'{HERE}/doncaster/wards.json'))
WARD_PLACE = {'Town': 'Doncaster town centre'}
# A catchment name that doesn't come down to the register's: the school's number
CATCH_SCHOOL = {}
# Academies whose DfE figures before conversion are under a closed school with a different number: the old school's URN
OLD_URN = {'150367': '134235'}   # The Mallard Academy (Mallard Primary School, closed 2024)


def place_of(r, loc):
    if r['code'] in PLACE_FIX:
        return PLACE_FIX[r['code']]
    if loc and loc != 'Doncaster':
        return loc
    ward = WARDS.get(r['postcode'])
    return WARD_PLACE.get(ward, re.split(r' & |, | and ', ward)[0]) if ward else 'Doncaster'


mi, mi19 = read_mi(f'{NY}/ofsted.csv'), read_mi(f'{NY}/ofsted2019.csv')
dfe = read_dfe(f'{NY}/dfe-offers.csv', {COUNCIL})
taking = {u for u, d in dfe.items() if 2026 in d['years']}
PRED = successors(f'{RAW}/gias.csv', LA, taking)
NUMBER, CLOSED, OLD_CODE = {}, {}, {}   # earlier academy conversions: older years under the closed school with the same number
for r in csv.DictReader(open(f'{RAW}/gias.csv', encoding='cp1252')):
    if r['LA (code)'] != LA:
        continue
    NUMBER[r['URN']] = r['EstablishmentNumber']
    if r['EstablishmentStatus (name)'] == 'Closed' and r['CloseDate'][-4:] >= '2022':
        CLOSED.setdefault(r['EstablishmentNumber'], []).append(r['URN'])


def figs(urn):
    """The DfE's figures for a school, with its predecessors' years where it has none of its own."""
    years, con = {}, None
    olds = ([PRED[urn]['URN']] if urn in PRED else []) + ([OLD_URN[urn]] if urn in OLD_URN else []) + CLOSED.get(NUMBER.get(urn, ''), [])
    for u in olds + [urn]:
        d = dfe.get(u) or {}
        years.update(d.get('years', {}))
        con = d.get('con') or con
    return {'con': con, 'years': years, 'olds': olds}


reg = register_schools(f'{RAW}/gias.csv', LA, taking | set(PRED) | set(OLD_URN))
STREET = re.compile(r'\b(road|lane|street|avenue|grove|close|crescent|way|terrace|walk|drive|gardens|place|row)$|\d', re.I)
schools = []
for r in reg:
    loc = r['locality'] if r['locality'] and not STREET.search(r['locality']) else r['town'].title() if r['town'].isupper() else r['town']
    f = figs(r['urn'])
    s = {'dfe': r['code'], 'urn': r['urn'], 'name': re.sub(r'\s+-\s+a Catholic voluntary academy$', '', r['name'], flags=re.I),
         'place': place_of(r, loc), 'method': 'straight_line', 'll': r['ll'], 'postcode': r['postcode'], 'addr': r['addr'],
         'web': WEB.get(r['code'], r['web']), 'of': ofsted(mi.get(f'{LA}{r["code"]}'), mi19),
         'con': f['con'] if f['con'] and f['con'] != 'n/a' else None,
         'type': kind(r['kind'], r['faith'] if r['faith'] not in ('Does not apply', 'None') else None),
         'own': OWN_RULES(r['kind']), 'src': DFE_SRC, 'pan': None,
         'codes': {r['code']} | {int(NUMBER[u]) for u in f['olds'] if NUMBER.get(u, '').isdigit()}}   # its number, and its old ones
    s['d'] = [firsts_year(y, f['years'][y]) for y in YEARS if y in f['years']]
    if len(s['d']) < len(YEARS):
        print(f'  {s["name"]} ({s["dfe"]}): only {[x["y"] for x in s["d"]]}')
    if not s['con']:
        print(f'  no constituency: {s["name"]} ({s["dfe"]}), {s["postcode"]}')
    schools.append(s)

# ---------- catchments ----------
letters = lambda n: re.sub(r'[^a-z]', '', n.lower().replace('’', "'").replace("'", ''))
DROP = (r'\b(Church of England|C of E|CofE|CE|Catholic|Primary|Infant|Junior|School|Academy|Saint|St|Nursery|The|and)\b|\.')
norm = lambda n: letters(re.sub(DROP, ' ', n, flags=re.I))


def school_named(n):
    hit = [s for s in schools if norm(s['name']) == norm(n)]
    hit = hit or [s for s in schools if norm(s['name']).startswith(norm(n)) or norm(n).startswith(norm(s['name']))]
    return hit or [s for s in schools if norm(n) in norm(s['name'])]   # "Shaw Wood Academy": Armthorpe Shaw Wood Academy


shapes = {}   # URN -> its polygons, and the option areas it shares
for f in json.load(open(f'{RAW}/catchments.geojson'))['features']:
    p = f['properties']
    title = p['Name']
    if title.startswith('Unity Area'):
        continue
    parts = re.split(r' or |, ', title)
    if len(parts) > 1:   # an option area: every school named
        owners = [school_named(re.sub(r'\s+School$', '', n.strip())) for n in parts]
    elif title in CATCH_SCHOOL:
        owners = [[s for s in schools if s['dfe'] == CATCH_SCHOOL[title]]]
    else:
        # by name first: Branton St Wilfrid's area carries Canon Popham's number (3313; Branton is 3312)
        named = school_named(title)
        owners = [named if len(named) == 1 else [s for s in schools if p['DfENumber'] in s['codes']]]
    for o, n in zip(owners, parts):
        if len(o) != 1:
            print(f'  catchment {title!r}: {n!r} matches {[s["name"] for s in o]}')
            continue
        shapes.setdefault(o[0]['urn'], []).append(shape(f['geometry']).buffer(0))

catch = []
for s in schools:
    if s['urn'] not in shapes:
        continue
    g = unary_union(shapes[s['urn']]).buffer(0).simplify(0.00003, preserve_topology=True)   # about 3 metres
    if not g.buffer(0.002).contains(Point(s['ll'][1], s['ll'][0])):
        print(f'  {s["name"]} is outside its own catchment')
    polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
    s['cz'] = [len(catch)]
    catch.append({'name': f'{s["name"]} catchment', 'p': [[[[round(y, 5), round(x, 5)] for x, y in ring.coords] for ring in [q.exterior, *q.interiors]] for q in polys]})
print('  no catchment:', [s['name'] for s in schools if 'cz' not in s])
for s in schools:
    s.pop('codes')

out = {'schools': sorted(schools, key=lambda s: s['name']), 'catch': catch,
       'sources': [{'year': y, 'url': DFE_SRC} for y in YEARS], 'updated': datetime.date.today().isoformat()}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(f'{len(schools)} schools, {len(catch)} catchments, {len(json.dumps(out, separators=(",", ":"))) // 1024} KB')
