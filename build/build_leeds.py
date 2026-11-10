"""Build the Leeds school data, in the same shape as build_data.py's North Yorkshire file.

Usage:  python3 -I build/build_leeds.py <raw-dir> <ny-raw-dir> <out.json>

<raw-dir> holds build/fetch_leeds.sh's files: gias.csv and leeds-2023.csv to leeds-2026.csv (Data Mill North's
"Primary school allocations": each school's places, and 2023's figures). <ny-raw-dir> holds build/fetch.sh's national
files (ofsted.csv, ofsted2019.csv, dfe-offers.csv).
Who got in from 2024 comes from build/leeds/cutoffs.json (build/leeds_tables.py), and the catchments from
build/leeds/catchments.geojson (build/leeds_maps.py). Needs shapely and pyproj.

Leeds community and voluntary controlled schools give places to children in care, then children with exceptional
needs, then brothers and sisters, then children in the school's catchment, then everyone else, nearest first in a
straight line from the school building. The council publishes, for every school, whether everyone was admitted or
the furthest distance offered and the last priority admitted, with the school's own description of it:
- "Any other children" at a school with a catchment: everyone in the catchment, plus others within that distance;
  at a school without one: brothers and sisters, then others within it;
- a catchment priority: only children in the catchment, and the last place went that far;
- anything else (faith, a parish, a feeder school, brothers and sisters): by the school's own rules, to that distance.
2023 has no published PDF, so it comes from Data Mill North's file, which covers only schools that follow the
council's rules: a school counts as full when it gave all its places and the file has a distance (about 96% agree
with the PDFs in the years that have both). Other schools' 2023 is the DfE's first-choice figures.
"""
import csv, datetime, json, os, re, sys
from shapely.geometry import shape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # common.py, which isolated mode (-I) won't find on its own
from common import OWN_RULES, firsts_year, kind, ofsted, read_dfe, read_mi, register_schools, successors

RAW, NY, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
HERE = os.path.dirname(os.path.abspath(__file__))
YEARS = (2026, 2025, 2024, 2023)
LA, COUNCIL, MI = '383', 'Leeds', 1609.344
SRC = {2026: 'https://www.leeds.gov.uk/sites/default/files/2026-04/cut%20off%20distances%20and%20criteria%20for%20primary%20and%20junior%20schools%202026.pdf',
       2025: 'https://www.leeds.gov.uk/sites/default/files/2025-04/primary%20school%20cut%20off%20distances.pdf',
       2024: 'https://www.leeds.gov.uk/docs/2024%20Primary%20and%20Junior%20School%20cut%20off%20distances.pdf',
       2023: 'https://datamillnorth.org/dataset/primary-school-allocations'}
# The council numbers the primary phases of two all-through schools apart from the register (register number: council's)
COUNCIL_CODE = {4063: 8901, 4041: 8902}   # Roundhay School, Carr Manor Community School
# School websites the register has wrong or lacks (build/check_websites.py, 10 November 2026): Asquith's and
# St Edward's addresses moved, Greenmount's answers only without https, Lift Cottingley is under its trust's name,
# and four weren't listed. Little London Academy has none that could be found
WEB = {2006: 'https://www.liftcottingley.org/', 3358: 'https://www.st-edwards.leeds.sch.uk/', 2312: 'https://www.thorpeprimary.co.uk/', 2034: 'https://www.aldertreeprimary.org.uk/', 2512: 'https://www.asquithprimary.leeds.sch.uk/', 2473: 'http://www.greenmountprimary.co.uk/', 2027: 'https://www.ccuaprimary.co.uk/', 2041: 'https://www.cobden.leeds.sch.uk/'}
# The register's locality where it's a street or estate rather than the part of Leeds
PLACE_FIX = {3370: 'Halton Moor', 2458: 'Cross Gates'}   # Corpus Christi's postcode has no ward; Cross Gates Primary is in Seacroft's ward
# Where the register gives only "Leeds", the school's council ward (build/leeds/wards.json, from postcodes.io), by
# its first name ("Headingley & Hyde Park" -> Headingley) or the better-known one
WARDS = json.load(open(f'{HERE}/leeds/wards.json'))
WARD_PLACE = {'Middleton Park': 'Middleton', 'Killingbeck & Seacroft': 'Seacroft', 'Gipton & Harehills': 'Harehills'}
SPELL = {'Crossgates': 'Cross Gates', 'Churwell Morley': 'Churwell'}


def place_of(r, loc):
    if r['code'] in PLACE_FIX:
        return PLACE_FIX[r['code']]
    if loc and loc != 'Leeds':
        return SPELL.get(loc, loc)
    ward = WARDS.get(r['postcode'])
    return WARD_PLACE.get(ward, ward.split(' & ')[0]) if ward else 'Leeds'

mi, mi19 = read_mi(f'{NY}/ofsted.csv'), read_mi(f'{NY}/ofsted2019.csv')
dfe = read_dfe(f'{NY}/dfe-offers.csv', {COUNCIL})
taking = {u for u, d in dfe.items() if 2026 in d['years']}
PRED = successors(f'{RAW}/gias.csv', LA, taking)   # Otley the Whartons and St Oswald's became academies in 2026
# and two that took a new school number too: Cobden Primary reopened as an academy in September 2026, Ingram Road
# became Cockburn Ingram Road Academy in July 2025
OLD_URN = {'152460': '107963', '151719': '107952'}
gias_rows = {r['URN']: r for r in csv.DictReader(open(f'{RAW}/gias.csv', encoding='cp1252')) if r['URN'] in OLD_URN.values()}
PRED.update({new: gias_rows[old] for new, old in OLD_URN.items()})


# Earlier academy conversions: the DfE's older years are under the closed school with the same number
NUMBER = {r['URN']: r['EstablishmentNumber'] for r in csv.DictReader(open(f'{RAW}/gias.csv', encoding='cp1252')) if r['LA (code)'] == LA}
CLOSED = {}
for r in csv.DictReader(open(f'{RAW}/gias.csv', encoding='cp1252')):
    if r['LA (code)'] == LA and r['EstablishmentStatus (name)'] == 'Closed' and r['CloseDate'][-4:] >= '2022':
        CLOSED.setdefault(r['EstablishmentNumber'], []).append(r['URN'])


def figs(urn):
    """The DfE's figures for a school, with its predecessors' years where it has none of its own."""
    olds = ([PRED[urn]['URN']] if urn in PRED else []) + CLOSED.get(NUMBER.get(urn, ''), [])
    years, con = {}, None
    for u in olds + [urn]:   # its own figures last, so they win
        d = dfe.get(u) or {}
        years.update(d.get('years', {}))
        con = d.get('con') or con
    return {'con': con, 'years': years}
reg = register_schools(f'{RAW}/gias.csv', LA, taking | set(PRED))
STREET = re.compile(r'\b(road|lane|street|avenue|grove|close|crescent|way|terrace|walk|drive|gardens|place|row)$|\d', re.I)

# ---------- who got in ----------
cut = {int(y): {r['code']: r for r in rows} for y, rows in json.load(open(f'{HERE}/leeds/cutoffs.json')).items()}
def datamill(y):
    rows = list(csv.reader(open(f'{RAW}/leeds-{y}.csv', encoding='utf-8-sig', errors='replace')))
    head = [h.strip() for h in rows[1]]
    return ({int(d['School Code']): d for d in (dict(zip(head, [x.strip() for x in r])) for r in rows[2:] if r and r[0].strip().isdigit())},
            next(h for h in head if 'Furthest' in h))


DM = {y: datamill(y)[0] for y in YEARS}   # each year's places, for the schools that follow the council's rules
dm23, DIST23 = datamill(2023)
places = lambda s, y: next((int(t['Published Admission Number']) for c in numbers(s) if (t := DM[y].get(c)) and t.get('Published Admission Number')), None)


def numbers(s):
    """Every number the council's files may use for a school: its own, the council's for an all-through school's primary
    phase, and its predecessor's."""
    return [s['dfe']] + [c for c in (COUNCIL_CODE.get(s['dfe']), int(PRED[s['urn']]['EstablishmentNumber']) if s['urn'] in PRED else None) if c]


def group(desc, has_catch):
    d = (desc or '').lower()
    if 'other children' in d:
        return 'out' if has_catch else 'near'
    if 'catchment' in d:
        return 'in'
    return 'crit'


def year_rec(s, y):
    d = figs(s['urn']).get('years', {}).get(y) or {}
    codes = numbers(s)
    base = {'y': y, **{k: d[k] for k in ('a', 'f') if d.get(k) is not None}, **({'o': d['o']} if d.get('o') is not None else {}),
            **({'p': places(s, y)} if places(s, y) else {})}
    if y in cut:
        t = next((cut[y][c] for c in codes if c in cut[y]), None)
        if not t:
            return firsts_year(y, d) if d else None
        if t['all']:
            return {**base, 's': 'all_offered'}
        rec = {**base, 's': 'distance', 'g': group(t['desc'], bool(s.get('cz'))), 'm': round(t['dist'] * MI), 'mi': t['dist']}
        if rec['g'] == 'crit' and t['desc']:   # say which of the school's own rules the last place went under
            rec['n'] = f'the last place went under its rule “{t["desc"].rstrip(".")}”'
        return rec
    t = next((dm23[c] for c in codes if c in dm23 and dm23[c].get('Published Admission Number')), None)
    if not t:
        return firsts_year(y, d) if d else None
    pan, given = int(t['Published Admission Number'] or 0), int(t['Places Allocated'] or 0)
    if not re.fullmatch(r'[\d.]+', t[DIST23]) or given < pan:
        return {**base, 's': 'all_offered', 'p': pan}
    last = t['Last Criteria Admitted']
    g = {'5': 'out' if s.get('cz') else 'near', '4': 'in'}.get(last, 'crit')
    return {**base, 's': 'distance', 'g': g, 'm': round(float(t[DIST23]) * MI), 'mi': float(t[DIST23]), 'p': pan}


schools = []
for r in reg:
    loc = r['locality'] if r['locality'] and not STREET.search(r['locality']) else r['town'].title() if r['town'].isupper() else r['town']
    schools.append({'dfe': r['code'], 'urn': r['urn'], 'name': re.sub(r'\s+-\s+a Catholic voluntary academy$', '', r['name'], flags=re.I),
                    'place': place_of(r, loc), 'method': 'straight_line', 'll': r['ll'],
                    'postcode': r['postcode'], 'addr': r['addr'], 'web': WEB.get(r['code'], r['web']),
                    'of': ofsted(mi.get(f'{LA}{r["code"]}'), mi19), 'con': figs(r['urn']).get('con'),
                    'type': kind(r['kind'], r['faith'] if r['faith'] not in ('Does not apply', 'None') else None),
                    'own': OWN_RULES(r['kind'])})

# ---------- catchments: read from the council's maps (build/leeds_maps.py) ----------
catch = []
geo = json.load(open(f'{HERE}/leeds/catchments.geojson'))['features']
for f in geo:
    owners = [s for s in schools if f['properties']['dfe'] in numbers(s)]
    if not owners:
        print(f'  a catchment for a school not in the checker: {f["properties"]["name"]}')
        continue
    g = shape(f['geometry'])
    polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
    rings = [[[[round(y, 5), round(x, 5)] for x, y in ring.coords] for ring in [q.exterior, *q.interiors]] for q in polys]
    for s in owners:
        s.setdefault('cz', []).append(len(catch))
    catch.append({'name': f['properties']['name'], 'p': rings})

for s in schools:
    s['d'] = [x for x in (year_rec(s, y) for y in YEARS) if x]
    if len(s['d']) < len(YEARS):
        print(f'  {s["name"]} ({s["dfe"]}): only {[x["y"] for x in s["d"]]}')
    s['pan'] = next((places(s, y) for y in YEARS if places(s, y)), None)
    s['src'] = SRC[2026]
for c in (2024, 2025, 2026):
    known = {n for s in schools for n in numbers(s)}
    left = [t['name'] for k, t in cut[c].items() if k not in known]
    if c == 2026 and left:
        print(f'  in the 2026 PDF but not in the checker: {left}')

out = {'schools': sorted(schools, key=lambda s: s['name']), 'catch': catch,
       'sources': [{'year': y, 'url': SRC[y]} for y in YEARS], 'updated': datetime.date.today().isoformat()}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(f'{len(schools)} schools, {len(catch)} catchments, {sum(1 for s in schools if "cz" not in s)} schools without one, '
      f'{len(json.dumps(out, separators=(",", ":"))) // 1024} KB')
