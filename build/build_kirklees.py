"""Build the Kirklees school data, in the same shape as build_data.py's North Yorkshire file.

Usage:  python3 -I build/build_kirklees.py <raw-dir> <ny-raw-dir> <out.json>

<raw-dir> holds build/fetch_kirklees.sh's files: gias.csv, paa.json and paa-attrs.json (the council's primary
priority admission areas, from its public map) and nopaa.json (the schools it lists as having none). <ny-raw-dir>
holds build/fetch.sh's national files (ofsted.csv, ofsted2019.csv, dfe-offers.csv). Who got in comes from
build/kirklees/allocations.json (build/kirklees_tables.py). Needs shapely and pyproj.

Kirklees calls catchments "priority admission areas". Community and voluntary controlled schools give places to
children in care, then children in the area with a brother or sister at the school, then others in the area, then
children from outside it with a brother or sister, then everyone else, all by straight-line distance. The council's
tables count each school's places under those rules and give the distance of the last on-time place, so:
- nobody refused: everyone who applied on time got in;
- refused, and children from outside the area got places: everyone in the area, plus others within that distance;
- only brothers and sisters from outside: everyone in the area, plus brothers and sisters;
- only children in the area: not everyone in it, and the last place went that far.
Schools that set their own rules (academies, church schools) are counted under their own criteria, which differ
from school to school, so a refused year reads "by the school's own rules, within that distance".
"""
import csv, datetime, json, os, re, sys
from pyproj import Transformer
from shapely.geometry import shape
from shapely.ops import transform

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # common.py, which isolated mode (-I) won't find on its own
from common import OWN_RULES, kind, ofsted, read_dfe, read_mi, register_schools

RAW, NY, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
HERE = os.path.dirname(os.path.abspath(__file__))
YEARS = (2026, 2025, 2024, 2023)
LA, COUNCIL = '382', 'Kirklees'
SRC = 'https://www.kirklees.gov.uk/beta/admissions/pdf/reception-by-preference-and-criteria-26.pdf'
# The council's names where they don't come down to the register's (register name, lower case: council name)
NAME_FIX = {'linthwaite clough primary school': 'Linthwaite Clough J I & Early Years Unit'}   # renamed in 2026, with a new number
# School websites the register has wrong or lacks (build/check_websites.py, 10 November 2026): four schools' old
# kgfl.dbprimary.com addresses no longer answer; Manor Road still had Golcar's; Whitechapel's site shows only an error page
WEB = {2069: 'https://cloughheadpri-kgfl.secure-dbprimary.com/kgfl/primary/cloughheadpri', 2122: 'https://lydgateprimary-kgfl.secure-dbprimary.com/kgfl/primary/lydgateprimary', 2135: 'https://norristhorpeprimary-kgfl.secure-dbprimary.com/kgfl/primary/norristhorpeprimary', 2076: 'https://wellhousepri-kgfl.secure-dbprimary.com/kgfl/primary/wellhousepri', 2151: 'https://manorroadacademy.co.uk/', 3412: None}
# The register's locality where it's a street or estate rather than the town or village
PLACE_FIX = {3022: 'Flockton'}   # the register gives only its post town, Wakefield

mi, mi19 = read_mi(f'{NY}/ofsted.csv'), read_mi(f'{NY}/ofsted2019.csv')
dfe = read_dfe(f'{NY}/dfe-offers.csv', {COUNCIL})
# Schools that became academies after the DfE's 2026 figures: the register has them under a new URN, with the same
# school number as the closed one the figures are under (Golcar Junior Infant and Nursery became Manor Road Academy)
gias = [r for r in csv.DictReader(open(f'{RAW}/gias.csv', encoding='cp1252')) if r['LA (code)'] == LA]
taking = {u for u, d in dfe.items() if 2026 in d['years']}
closed = {r['EstablishmentNumber']: r for r in gias if r['URN'] in taking and not r['EstablishmentStatus (name)'].startswith('Open')}
PRED = {r['URN']: closed[r['EstablishmentNumber']] for r in gias
        if r['EstablishmentStatus (name)'].startswith('Open') and r['EstablishmentNumber'] in closed and r['URN'] not in taking}
figs = lambda urn: dfe.get(urn) or dfe.get(PRED[urn]['URN'] if urn in PRED else '') or {}
reg = register_schools(f'{RAW}/gias.csv', LA, taking | set(PRED))
STREET = re.compile(r'\b(road|lane|street|avenue|grove|close|crescent|way|terrace|walk|drive|gardens|place|row)$|\d', re.I)

# ---------- who got in: the council's tables ----------
DROP = (r"\b(primary|school|academy|junior|infant|infants|nursery|first|and|j|i|n|community|ce|cofe|c of e|church of england|"
        r"vc|va|c|catholic|rc|the|st|saint|voluntary|controlled|aided|a share|endowed|foundation stage|early years|years|early)\b")
norm = lambda n: re.sub(r'\bc\s*\.?\s*e\b\.?', 'ce', n.lower().replace('&', ' and ').replace('’', "'"))   # "C E", "C.E."
key = lambda n: re.sub(r'\s+', '', re.sub(DROP, ' ', re.sub(r"[^a-z ]", ' ', norm(n))))
# a lighter key that keeps the kind of school, for names the loose one runs together ("St John's CE (VA) J & I School",
# "St John's CE Primary School")
LIGHT = r"\b(ce|cofe|c of e|church of england|vc|va|c|catholic|rc|voluntary|controlled|aided|the|st|saint)\b"
light = lambda n: re.sub(r'\s+', '', re.sub(LIGHT, ' ', re.sub(r"[^a-z ]", ' ', norm(n))))
tables = {int(y): rows for y, rows in json.load(open(f'{HERE}/kirklees/allocations.json')).items()}
by_light, by_key = {y: {} for y in YEARS}, {y: {} for y in YEARS}
for y in YEARS:
    for r in tables[y]:
        by_light[y][light(r['name'])] = r
        by_key[y].setdefault(key(r['name']), []).append(r)
by_code = {r['code']: r for r in tables[2023] if r.get('code')}   # 2023's rows carry the DfE number


def row(s, y):
    old = by_code.get(s['dfe']) or by_code.get(int(PRED[s['urn']]['EstablishmentNumber']) if s['urn'] in PRED else 0)
    # with its place first (the council writes "St Patrick's Catholic Primary Academy (Huddersfield)"), then the name
    # alone, a fix by hand, its 2023 row's name, and its name before it became an academy
    pred = PRED.get(s['urn'], {}).get('EstablishmentName')
    names = [n for n in (f"{s['reg']} {s['loc']}", f"{s['reg']} {s['town']}", s['reg'], NAME_FIX.get(s['reg'].lower(), ''),
                         old and old['name'], pred) if n]
    for n in names:
        if light(n) in by_light[y]:
            return by_light[y][light(n)]
    for n in names:
        if len(by_key[y].get(key(n), [])) == 1:
            return by_key[y][key(n)][0]
    return old if y == 2023 else None


def year_rec(s, y):
    d = figs(s['urn']).get('years', {}).get(y) or {}
    t = row(s, y)
    if not t:
        return None
    rec = {'y': y, **{k: d[k] for k in ('a', 'f') if d.get(k) is not None}, 'o': t['total'], 'p': t['pan']}
    if not t['over']:
        return {**rec, 's': 'all_offered'}   # nobody who applied on time was refused
    m = round(t['dist'])
    if t['table'] == 2:
        return {**rec, 's': 'distance', 'g': 'crit', 'm': m, 'mi': round(t['dist'] / 1609.344, 3)}
    if t.get('o'):
        g = 'out'   # children from outside the area got places, up to the last distance
    elif t.get('os'):
        return {**rec, 's': 'distance', 'g': 'sib'}   # from outside, only brothers and sisters
    else:
        g = 'in'    # only children in the area, and not all of them
    return {**rec, 's': 'distance', 'g': g, 'm': m, 'mi': round(t['dist'] / 1609.344, 3)}


schools = []
for r in reg:
    loc = r['locality'] if r['locality'] and not STREET.search(r['locality']) else r['town'].title() if r['town'].isupper() else r['town']
    s = {'dfe': r['code'], 'urn': r['urn'], 'name': re.sub(r'\s+-\s+a Catholic voluntary academy$', '', r['name'], flags=re.I),
         'place': PLACE_FIX.get(r['code'], loc or 'Huddersfield'), 'method': 'straight_line', 'll': r['ll'],
         'postcode': r['postcode'], 'addr': r['addr'], 'web': WEB.get(r['code'], r['web']),
         'of': ofsted(mi.get(f'{LA}{r["code"]}'), mi19), 'con': figs(r['urn']).get('con'),
         'type': kind(r['kind'], r['faith'] if r['faith'] not in ('Does not apply', 'None') else None),
         'own': OWN_RULES(r['kind']), 'src': SRC, 'reg': r['name'], 'loc': r['locality'], 'town': r['town']}
    s['d'] = [x for x in (year_rec(s, y) for y in YEARS) if x]
    if len(s['d']) < len(YEARS):
        print(f'  {s["name"]} ({s["dfe"]}): only {[x["y"] for x in s["d"]]} in the council tables')
    s['pan'] = next((row(s, y)['pan'] for y in YEARS if row(s, y)), None)
    schools.append(s)
used = {id(row(s, 2026)) for s in schools if row(s, 2026)}
for t in tables[2026]:
    if id(t) not in used:
        print(f'  in the 2026 table but not matched: {t["name"]}')
twice = [t['name'] for t in tables[2026] if sum(1 for s in schools if row(s, 2026) is t) > 1]
if twice:
    sys.exit(f'Rows matched to two schools: {twice}')

# ---------- catchments: the priority admission areas ----------
to_ll = Transformer.from_crs(27700, 4326, always_xy=True).transform
infant = {f['properties']['DFE']: f['properties'] for f in json.load(open(f'{RAW}/paa-attrs.json'))['features']}
catch = []
for f in json.load(open(f'{RAW}/paa.json'))['features']:
    p = infant[f['properties']['DFE']]
    # the schools that take Reception from it (two share some areas: "2049:2032")
    codes = {int(c) for c in (p['InfDfES'] or f['properties']['DFE']).split(':')}
    owners = [s for s in schools if s['dfe'] in codes]
    if len(owners) < len(codes):
        print(f'  a priority area for a school not in the checker: {p["School_Name"]} ({codes - {s["dfe"] for s in owners}})')
    if not owners:
        continue
    g = shape(f['geometry']).buffer(0).simplify(4, preserve_topology=True)   # 4 metres
    g = transform(to_ll, g)
    polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
    rings = [[[[round(y, 5), round(x, 5)] for x, y in ring.coords] for ring in [q.exterior, *q.interiors]] for q in polys]
    for s in owners:
        s.setdefault('cz', []).append(len(catch))
    catch.append({'name': p['Infant'] or p['School_Name'], 'p': rings})

none = {int(f['properties']['Dfes_code']) for f in json.load(open(f'{RAW}/nopaa.json'))['features']}
none.add(2080)   # Batley Parish: on the council's list under its number before it became an academy (3320)
for s in schools:
    if 'cz' not in s and s['dfe'] not in none:
        print(f'  no priority area, and not on the council\'s list of schools without one: {s["name"]} ({s["dfe"]})')
    for k in ('reg', 'loc', 'town'):
        s.pop(k)

out = {'schools': sorted(schools, key=lambda s: s['name']), 'catch': catch,
       'sources': [{'year': y, 'url': SRC.replace('-26.pdf', f'-{y % 100}.pdf')} for y in YEARS], 'updated': datetime.date.today().isoformat()}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(f'{len(schools)} schools, {len(catch)} priority areas, {sum(1 for s in schools if "cz" not in s)} schools without one, '
      f'{len(json.dumps(out, separators=(",", ":"))) // 1024} KB')
