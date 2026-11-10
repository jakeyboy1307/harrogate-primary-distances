"""Build the East Riding of Yorkshire school data, in the same shape as build_data.py's North Yorkshire file.

Usage:  python3 -I build/build_eastriding.py <er-raw-dir> <ny-raw-dir> <out.json>

<er-raw-dir> holds the files fetched by build/fetch_eastriding.sh (gias.csv, catch.geojson, the admission numbers
PDF); <ny-raw-dir> holds build/fetch.sh's national files (ofsted.csv, ofsted2019.csv, dfe-offers.csv). Needs
shapely and pyproj, and pdftotext on the path.

Who got in comes from the council's "Summary of primary school allocations" for 2024 to 2026, kept in
build/east-riding/allocations.csv. It lists every school that was oversubscribed or kept a waiting list; a school
not in it took everyone who applied that year. East Riding refuses no one without putting them on the waiting list,
so a listed school with no waiting list also took everyone. Otherwise the year's cut-off is read from which
criterion the last places went to, in the council's order: children in care and in the catchment, then brothers and
sisters, then distance (a straight line). Applications, first choices and offers come from the table where a school
is in it, and from the DfE's figures where it isn't.
"""
import csv, datetime, json, os, re, subprocess, sys
from pyproj import Transformer
from shapely.geometry import shape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # common.py, which isolated mode (-I) won't find on its own
from common import OWN_RULES, firsts_year, kind, ofsted, read_dfe, read_mi

RAW, NY, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
HERE = os.path.dirname(os.path.abspath(__file__))
YEARS = (2026, 2025, 2024)
LA = '811'
COUNCIL = 'East Riding of Yorkshire'
MI = 1609.344
SRC = 'https://www.eastriding.gov.uk/learning/schools-colleges-and-academies/school-admissions/school-admissions-documents/'
TYPES = {'Community school': 'Community School', 'Voluntary controlled school': 'Voluntary Controlled',
         'Voluntary aided school': 'Voluntary Aided', 'Foundation school': 'Foundation', 'Academy converter': 'Academy',
         'Academy sponsor led': 'Academy', 'Free schools': 'Free School'}

# The catchment layer (School_Boundaries_23_Update) still uses the numbers schools had before becoming academies or
# merging their infant and junior schools. A merged primary takes its former infant school's catchment.
CATCH_CODE = {3511: 2764, 3512: 2760, 3509: 2759, 3510: 2727, 3513: 2775, 2478: 2714, 4053: 2729, 2005: 2002,
              5204: 2752, 2009: 3038, 2010: 2724, 2011: 2756, 2012: 3020, 2013: 3033, 2014: 2779, 2015: 3013, 2016: 2731}
# The allocation summaries' names for schools whose name has changed or is shared
ALLOC_NAME = {'hessle penshurst primary school': 4053, "st mary's catholic primary school": 3315,
              "st mary's catholic primary school, market weighton": 3315, "st mary's & st joseph's catholic primary school": 3317,
              "st joseph's catholic primary school": 3332, 'bugthorpe primary school': 3047, 'driffield northfield infant school': 2889,
              'holme on spalding moor primary school': 2732, 'hunsley primary school': 2007, 'north cave ce vc primary school': 3031,
              "st martin's ce va primary school": 3316, 'warter ce vc primary school': 5203, 'wilberfoss ce vc primary school': 3045}
# Town or village where the register's address doesn't give it: its post town is a bigger place nearby
PLACE = {2777: 'Anlaby Common', 2011: 'Cottingham', 3034: 'Pocklington', 3047: 'Bugthorpe', 2741: 'North Frodingham',
         3086: 'Sledmere', 3316: 'Fangfoss'}
STREET = re.compile(r'\b(road|lane|street|avenue|grove|close|crescent|way|terrace|walk|drive|gardens|place|row|hill|'
                    r'crosshill)$|\d', re.I)


def place_of(r):
    """The village or district: the register's locality (unless it's a street), else the post town."""
    x = r['Locality'].split(',')[0].strip()
    if x and not STREET.search(x):
        return x
    t = r['Town'].split(',')[0].strip()   # "Reedness, Goole"
    return t.title() if t.isupper() else t
# School websites the register has wrong (build/check_websites.py, 9 November 2026): Kirk Ella's old .org address now
# belongs to a gambling site, St Nicholas's is parked, Withernsea's and Aldbrough's have gone
WEB = {2765: 'https://kirkellaprimaryschool.org.uk/', 2704: 'https://beverleystnicholasprimary.org.uk/',
       5204: 'https://withernsea.greenhousecms.co.uk/', 2700: 'https://aldbrough.e-riding.sch.uk/',
       2015: 'https://beverleyminsterprimary.co.uk/', 3040: 'https://skirlaughprimary.com/'}

to_ll = Transformer.from_crs(27700, 4326, always_xy=True)
mi, mi19 = read_mi(f'{NY}/ofsted.csv'), read_mi(f'{NY}/ofsted2019.csv')
dfe = read_dfe(f'{NY}/dfe-offers.csv', {COUNCIL})
reception = {u for u, d in dfe.items() if 2026 in d['years']}   # schools with a Reception intake in 2026

# ---------- admission numbers (community and voluntary controlled schools), for "places a year" ----------
pan = {}
txt = subprocess.run(['pdftotext', '-layout', f'{RAW}/admission_numbers.pdf', '-'], capture_output=True, text=True).stdout
for line in txt.splitlines():
    m = re.match(r'\s*(\S.*?(?:School|Academy)[^\d]*?)\s{2,}(\d+)\s*$', line)
    if m:
        pan[m.group(1).strip().lower()] = int(m.group(2))


def norm(n):
    n = n.lower().replace('church of england', 'ce').replace('cofe', 'ce').replace('c of e', 'ce').replace('’', "'")
    n = n.replace('voluntary controlled', 'vc').replace('voluntary aided', 'va').replace(' community primary', ' primary')
    n = re.sub(r'\s*-\s*a catholic voluntary academy|\s*a catholic voluntary academy', '', n)
    return re.sub(r'\s+', ' ', n).strip()


# ---------- schools: the national register's open primary schools with a Reception intake ----------
schools = []
for r in csv.DictReader(open(f'{RAW}/gias.csv', encoding='cp1252')):
    if r['LA (code)'] != LA or not r['EstablishmentStatus (name)'].startswith('Open'):
        continue
    if r['PhaseOfEducation (name)'] not in ('Primary', 'All-through') or r['URN'] not in reception:
        continue
    code = int(r['EstablishmentNumber'])
    lng, lat = to_ll.transform(float(r['Easting']), float(r['Northing']))
    name = re.sub(r'\s*-\s*a Catholic voluntary academy$|\s+A Catholic Voluntary Academy$', '', r['EstablishmentName'], flags=re.I)
    name = re.sub(r'\s+(Cottingham|Goole)$', '', name)   # "Hallgate Primary School Cottingham": the town goes in place
    if code == 4053:
        name = 'Hessle Penshurst Primary School'   # the register names the all-through school; its primary is Penshurst
    addr = ', '.join(x for x in (r['Street'], r['Locality'], r['Address3'], r['Town'], r['Postcode']) if x)
    web = r['SchoolWebsite'].strip()
    if web and not web.startswith('http'):
        web = 'https://' + web
    schools.append({
        'dfe': code, 'urn': r['URN'], 'name': name, 'place': PLACE.get(code) or place_of(r),
        'kind': TYPES[r['TypeOfEstablishment (name)']], 'faith': r['ReligiousCharacter (name)'],
        'method': 'straight_line', 'd': [], 'll': [round(lat, 6), round(lng, 6)], 'postcode': r['Postcode'], 'addr': addr,
        'web': WEB.get(code, web or None), 'of': ofsted(mi.get(f'{LA}{code}'), mi19), 'con': dfe[r['URN']].get('con'),
    })
by_code = {s['dfe']: s for s in schools}
by_name = {norm(s['name']): s for s in schools}

# ---------- each year: the council's table, else everyone got in ----------
num = lambda v: int(v) if str(v).strip().isdigit() else 0
alloc = {}
rows = list(csv.reader(l for l in open(f'{HERE}/east-riding/allocations.csv') if not l.startswith('#')))
for r in [dict(zip(rows[0], x)) for x in rows[1:]]:
    k = norm(r['school'])
    s = by_code.get(ALLOC_NAME.get(k)) or by_name.get(k)
    if not s:
        sys.exit(f'allocations.csv: no school called {r["school"]}')
    y = int(r['year'])
    if sum(num(r[c]) for c in ('catch', 'sib', 'rel', 'other', 'dist')) > num(r['total']):
        sys.exit(f'allocations.csv: {y} {r["school"]} gives more places by criterion than it allocated')
    f = dfe[s['urn']]['years'].get(y, {}).get('f')
    if f is not None and f != num(r['p1']):
        print(f'  {y} {s["name"]}: {r["p1"]} first preferences in the council table, {f} in the DfE figures')
    alloc[(s['dfe'], y)] = r


def year(s, y):
    d = dfe[s['urn']]['years'].get(y)
    r = alloc.get((s['dfe'], y))
    if not r:
        if not d:
            return None
        if d['fo'] < d['f']:   # missing from the council's table, but the DfE's figures show first choices refused
            print(f'  {y} {s["name"]}: not in the council table, but only {d["fo"]} of {d["f"]} first choices got in')
            return firsts_year(y, d)
        return {'y': y, 's': 'all_offered', 'a': d['a'], 'f': d['f'], 'o': d['o']}
    rec = {'y': y, 'a': num(r['p1']) + num(r['p2']) + num(r['p3']), 'f': num(r['p1']), 'o': num(r['total']), 'p': num(r['places'])}
    last = float(r['last']) * MI if re.match(r'^\d+(\.\d+)?$', r['last']) else None
    if num(r['waiting']) == 0:   # no one refused
        return {**rec, 's': 'all_offered'}
    if num(r['dist']):
        g = 'out'
    elif num(r['rel']) or num(r['other']):
        g = 'crit'
    elif num(r['sib']):
        g = 'sib'
    else:
        g = 'in'
    if last is None and g in ('out', 'crit', 'in'):
        return {**rec, 's': 'not_published', 'n': 'only children in the catchment got places; the council didn’t publish how far the last one was'
                if g == 'in' else 'the council didn’t publish how far the last place went'}
    rec.update(s='distance', g=g)
    if last is not None:
        rec['m'] = round(last)
        rec['mi'] = float(r['last'])
    return rec


for s in schools:
    s['d'] = [r for r in (year(s, y) for y in YEARS) if r]
    s['pan'] = pan.get(s['name'].lower()) or next((r['p'] for r in s['d'] if r.get('p')), None)
    if not s['d']:
        print(f'  no figures for {s["name"]}')

# ---------- catchments ----------
catch = []
for f in json.load(open(f'{RAW}/catch.geojson'))['features']:
    code = int(f['properties']['CODE'])
    owners = [s for s in schools if CATCH_CODE.get(s['dfe'], s['dfe']) == code]
    if not owners:
        continue
    g = shape(f['geometry']).buffer(0).simplify(0.00006, preserve_topology=True)
    polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
    rings = [[[[round(y, 5), round(x, 5)] for x, y in ring.coords] for ring in [p.exterior, *p.interiors]] for p in polys]
    for s in owners:
        s.setdefault('cz', []).append(len(catch))
    catch.append({'name': f['properties']['NAME'], 'p': rings})

# ---------- tidy ----------
for s in schools:
    if 'cz' not in s:
        print(f'  no catchment for {s["name"]}')
    s['type'] = kind(s['kind'], s['faith'] if s['faith'] not in ('Does not apply', 'None') else None)
    s['own'] = OWN_RULES(s['kind'])
    s['src'] = SRC
    for k in ('kind', 'faith'):
        s.pop(k)

out = {'schools': sorted(schools, key=lambda s: s['name']), 'catch': catch,
       'sources': [{'year': y, 'url': SRC} for y in YEARS], 'updated': datetime.date.today().isoformat()}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(f'{len(schools)} schools, {len(catch)} catchment areas, {len(json.dumps(out, separators=(",", ":"))) // 1024} KB')
