"""Build the City of York school data, in the same shape as build_data.py's North Yorkshire file.

Usage:  python3 -I build/build_york.py <york-raw-dir> <ny-raw-dir> <out.json>

<york-raw-dir> holds the files fetched by build/fetch_york.sh; <ny-raw-dir> holds build/fetch.sh's national
Ofsted files (ofsted.csv, ofsted2019.csv). Needs shapely.

York measures distance by the safest walking route, home to school entrance, but doesn't publish how far the last place went. Instead it publishes every applicant's choices, catchment school
and outcome, so each year records how many applicants from inside and outside a school's catchment were turned
away: {'s': 'catchment', 'ia': inside, 'ir': inside refused, 'xa': outside, 'xr': outside refused}. An applicant
counts as refused by a school they ranked above the one they got (or by all their choices if they got none of
them). Applicants York has no outcome for (those who withdrew, or went to another council's school) are left out.
Checked against the council's own "Place Refused" figures for 2022, 2023 and 2025: the same count for 135 of 144
school-years, within two for the rest, and the same answer to "was anyone refused?" for 143 of 144.
"""
import csv, json, os, re, sys
from shapely.geometry import shape

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # common.py, which isolated mode (-I) won't find on its own
from common import OWN_RULES, kind, ofsted, read_mi

RAW, NY, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
YEARS = (2026, 2025, 2023, 2022)   # 2024's applicant file is incomplete
SRC = 'https://data.yorkopendata.org/dataset/pupil-level-outcome-summary-primary'
PC = re.compile(r'[A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}$')
TYPES = {'Academy Converter': 'Academy', 'Academy Sponsor Led': 'Academy', 'Free Schools': 'Academy',
         'Community School': 'Community School', 'Voluntary Controlled School': 'Voluntary Controlled',
         'Voluntary Aided School': 'Voluntary Aided', 'Foundation School': 'Foundation'}
STREET = re.compile(r'\b(road|lane|street|st|avenue|grove|close|crescent|way|terrace|green|parade|hill|bank|square|drive|'
                    r'walk|gardens|place|row|gate|balk|leyes|crossways|braeburn)$|\d', re.I)


def code(v):
    """A York school's own code from any of the files' spellings: 8162018, 2018 or ' 2018 '."""
    v = str(v or '').strip()
    return int(v[3:]) if len(v) == 7 and v.startswith('816') else int(v) if v.isdigit() else None


def place_of(addr, ward):
    """The district or village before 'York' in an address, else the council ward the school is in."""
    parts = [p.strip() for p in re.split(r'[,.]', addr) if p.strip()]
    i = next((i for i, p in enumerate(parts) if p.lower() == 'york'), len(parts))
    before = [p for p in parts[:i] if not STREET.search(p)]
    return before[-1] if before else ward.replace(' & ', ' and ')


# School websites the council has wrong (checked 9 November 2026): the trust moved from hslt.academy to hlt.academy
WEB = {2024: 'https://www.bgp.hlt.academy/', 2029: 'https://www.pop.hlt.academy/', 2169: 'https://www.ske.hlt.academy/'}

mi, mi19 = read_mi(f'{NY}/ofsted.csv'), read_mi(f'{NY}/ofsted2019.csv')
york_primary = {k: x for k, x in mi.items() if k.startswith('816') and x.get('Ofsted phase') == 'Primary'}

# ---------- schools: the council's points, joined to Ofsted by code, or by postcode where a school has a new code ----------
schools, seen = [], set()
for f in json.load(open(f'{RAW}/points.geojson'))['features']:
    p = f['properties']
    name, old = p['SCHNAME'], p['DFESNO']
    if old in seen or re.search(r'junior|nursery', name, re.I):
        continue
    seen.add(old)
    addr = re.sub(r'\s*\.\s*', ', ', p['LV_DETAILS'].strip())
    pc = PC.search(addr).group(0)
    x = mi.get(f'816{old}') or next((v for v in york_primary.values() if v['Postcode'].replace(' ', '') == pc.replace(' ', '')), None)
    if not x:
        print(f'  no Ofsted row for {name}, left out')
        continue
    new = int(x['LAESTAB'][3:])
    lng, lat = f['geometry']['coordinates']
    schools.append({
        'dfe': new, 'codes': sorted({old, new}), 'name': x['School name'].split(' - ')[0], 'place': place_of(addr, p['WARD']),
        'kind': TYPES[x['Type of education']], 'faith': x['Designated religious character'],
        'method': 'walking', 'd': [], 'll': [round(lat, 6), round(lng, 6)], 'postcode': pc, 'addr': addr,
        'web': WEB.get(new, p['WEBSITE']), 'of': ofsted(x, mi19),
    })

# ---------- each year's outcomes, from the applicant files ----------
places = {}
for y in (2022, 2023, 2024, 2025):
    rows = list(csv.reader(open(f'{RAW}/sum{y}.csv', encoding='utf-8-sig')))
    h = [c.strip() for c in rows[0]]
    for r in rows[1:]:
        if r and code(r[0]) and r[h.index('Places')].strip():
            places[(y, code(r[0]))] = int(r[h.index('Places')])

for y in YEARS:
    apps = []
    for r in list(csv.reader(open(f'{RAW}/plos{y}.csv', encoding='utf-8-sig')))[1:]:
        prefs = [code(v) for v in r[1:6]]
        apps.append({'got': code(r[0]), 'recorded': bool(r[0].strip()), 'prefs': prefs, 'catch': code(r[7])})
    for s in schools:
        mine = set(s['codes'])
        named = [a for a in apps if mine & set(a['prefs'])]
        if not named:
            continue
        rec = {'y': y, 'a': len(named), 'o': sum(1 for a in apps if a['got'] in mine),
               'f': sum(1 for a in apps if a['prefs'][0] in mine), 'ia': 0, 'ir': 0, 'xa': 0, 'xr': 0}
        for a in named:
            if not a['recorded']:
                continue
            here = next(i for i, c in enumerate(a['prefs']) if c in mine)
            got = next((i for i, c in enumerate(a['prefs']) if c == a['got']), 5)
            if here > got:
                continue   # they got a school they ranked higher, so this one wasn't tested
            side = 'i' if a['catch'] in mine else 'x'
            rec[side + 'a'] += 1
            rec[side + 'r'] += here < got
        rec['s'] = 'catchment' if rec['ir'] or rec['xr'] else 'all_offered'
        if rec['s'] == 'all_offered':
            for k in ('ia', 'ir', 'xa', 'xr'):
                del rec[k]
        p = places.get((y, s['dfe'])) or next((places[(y, c)] for c in s['codes'] if (y, c) in places), None)
        if p:
            rec['p'] = p
        s['d'].append(rec)
    if not any(r['y'] == y for s in schools for r in s['d']):
        print(f'  no {y} figures at all')

for s in schools:
    s['pan'] = next((r['p'] for r in s['d'] if r.get('p')), None)
    if not s['d']:
        print(f'  no applicant figures for {s["name"]}')

# ---------- catchments ----------
catch = []
for f in json.load(open(f'{RAW}/catch.geojson'))['features']:
    owners = [s for s in schools if f['properties']['DfESNo'] in s['codes']]
    if not owners:
        continue
    g = shape(f['geometry']).buffer(0).simplify(0.00006, preserve_topology=True)
    polys = [g] if g.geom_type == 'Polygon' else list(g.geoms)
    rings = [[[[round(y, 5), round(x, 5)] for x, y in ring.coords] for ring in [p.exterior, *p.interiors]] for p in polys]
    for s in owners:
        s.setdefault('cz', []).append(len(catch))
    catch.append({'name': f['properties']['SchName'], 'p': rings})

# ---------- tidy ----------
for s in schools:
    if 'cz' not in s:
        print(f'  no catchment for {s["name"]}')
    s['type'] = kind(s['kind'], s['faith'])
    s['own'] = OWN_RULES(s['kind'])
    s['src'] = SRC
    for k in ('kind', 'faith', 'codes'):
        s.pop(k, None)

import datetime
out = {'schools': sorted(schools, key=lambda s: s['name']), 'catch': catch, 'sources': [{'year': y, 'url': SRC} for y in YEARS],
       'updated': datetime.date.today().isoformat()}   # the sitemap's last-updated date for the school and area pages
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(f'{len(schools)} schools, {len(catch)} catchment areas, {len(json.dumps(out, separators=(",", ":"))) // 1024} KB')
