"""Build the Calderdale school data, in the same shape as build_data.py's North Yorkshire file.

Usage:  python3 -I build/build_calderdale.py <raw-dir> <ny-raw-dir> <out.json>

<raw-dir> holds build/fetch_calderdale.sh's files (gias.csv and one cald-YYYY.csv a year); <ny-raw-dir> holds
build/fetch.sh's national files (ofsted.csv, ofsted2019.csv, dfe-offers.csv). Needs pyproj.

Calderdale's primary schools have no catchment areas: places go to children in care, then brothers and sisters, then
the children who live nearest, in a straight line. Each year's open data gives every school's admission number, its
preferences, places offered, and for an oversubscribed school the distance of the furthest child offered a place:
- no distance, or "All on time prefs met/allocated": everyone who applied on time got in;
- a distance: places went up to that distance, after brothers and sisters (group "near"). The figure is the furthest
  child offered a place, which could be a brother or sister; the council doesn't say;
- a distance marked "in catchment" (Bolton Brow, an academy with its own catchment): only children in its catchment;
- a church school with its own faith rules: by the school's own rules, to that distance.
"""
import csv, datetime, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # common.py, which isolated mode (-I) won't find on its own
from common import OWN_RULES, kind, ofsted, read_dfe, read_mi, register_schools

RAW, NY, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
YEARS = (2026, 2025, 2024, 2023)
LA, COUNCIL, MI = '381', 'Calderdale', 1609.344
SRC = 'https://dataworks.calderdale.gov.uk/dataset/vq9q6'
# The council's names where they don't match the register's closely enough (register name, lower case: council name)
NAME_FIX = {'trinity academy whitehill': 'Whitehill Community Academy'}   # renamed in 2026; earlier years under its old name
# School websites the register has wrong or lacks (build/check_websites.py, 10 November 2026): St Joseph's, Todmorden isn't listed
WEB = {2029: 'https://www.st-josephs-tod.org.uk/'}
# The register's locality where it's a street or estate rather than the town or village
PLACE_FIX = {2056: 'Mytholmroyd', 5202: 'Shelf'}   # the register misspells Mytholmroyd; St Michael's is on Shelf's Greenacres estate

mi, mi19 = read_mi(f'{NY}/ofsted.csv'), read_mi(f'{NY}/ofsted2019.csv')
dfe = read_dfe(f'{NY}/dfe-offers.csv', {COUNCIL})
reg = register_schools(f'{RAW}/gias.csv', LA, {u for u, d in dfe.items() if 2026 in d['years']})
STREET = re.compile(r'\b(road|lane|street|avenue|grove|close|crescent|way|terrace|walk|drive|gardens|place|row)$|\d', re.I)

# ---------- the council's figures, one file a year ----------
DROP = r"\b(primary|school|academy|junior|infant|infants|nursery|and|j|i|n|community|ce|cofe|c of e|church of england|vc|va|catholic|rc|the|st|saint|cevc|voluntary|controlled|aided)\b"
# a name without its type words or trust ("St Mary's Catholic Primary Academy (Halifax)", "Holy Trinity
# Primary School, A Church of England Academy", "Salterlee Academy Trust" all come down to the school's own name)
TAIL = r"\b(a church of england academy|a voluntary academy|academy trust|pre school|in|coea)\b"
key = lambda n: re.sub(r'\s+', '', re.sub(DROP, ' ', re.sub(r"[^a-z ]", ' ', re.sub(TAIL, ' ', n.lower().replace('&', ' and ')).replace('coe', 'ce'))))
council = {}
for y in YEARS:
    rows = [r for r in csv.reader(open(f'{RAW}/cald-{y}.csv', encoding='utf-8-sig'))][1:]
    for r in rows:
        if not r or not r[0].strip() or not re.fullmatch(r'\d+', r[1].strip()):
            continue   # special schools ("n/a" places)
        if (key(r[0]), y) in council:
            sys.exit(f'Two schools come down to the same name in {y}: {council[(key(r[0]), y)]["name"]} and {r[0]}')
        council[(key(r[0]), y)] = {'name': r[0].strip(), 'pan': int(r[1]), 'o': int(r[8] or 0), 'd': r[9].strip()}


def row(s, y):
    # the register's name, then with its place added (the council writes "St Joseph's Catholic Primary Academy (Halifax)"
    # where the register has two of that name), then a fix by hand
    for n in (s['reg'], f"{s['reg']} {s['loc']}", f"{s['reg']} {s['town']}", NAME_FIX.get(s['reg'].lower(), '')):
        if n and (key(n), y) in council:
            return council[(key(n), y)]
    return None


def year_rec(s, r, y):
    d = dfe.get(s['urn'], {}).get('years', {}).get(y) or {}
    t = row(s, y)
    if not t:
        return None
    rec = {'y': y, **{k: d[k] for k in ('a', 'f') if d.get(k) is not None}, 'o': t['o'], 'p': t['pan']}
    raw = t['d']
    num = re.match(r'([\d.]+)', raw)
    if not num or 'all on time' in raw.lower():
        return {**rec, 's': 'all_offered'}   # not oversubscribed, or every on-time preference was met
    miles = float(num.group(1))
    if 'catchment' in raw.lower():
        g = 'in'
    elif t['name'] in HAS_CATCHMENT:
        g = 'out'    # its own catchment, but the last place went beyond it
    elif OWN_RULES(r['kind']) and r['faith'] not in ('Does not apply', 'None', ''):
        g = 'crit'   # a church school with its own faith rules
    else:
        g = 'near'   # children in care, brothers and sisters, then the nearest
    return {**rec, 's': 'distance', 'g': g, 'm': round(miles * MI), 'mi': miles}


# Academies with a catchment of their own: the council marks their last place "in catchment" in some years
HAS_CATCHMENT = {v['name'] for (k, y), v in council.items() if 'catchment' in v['d'].lower()}
# The register's name where parents know the school by another: the Calder Learning Trust's primary is Calder Primary
RENAME = {'150387': 'Calder Primary School (The Calder Learning Trust)'}
schools = []
for r in reg:
    loc = r['locality'] if r['locality'] and not STREET.search(r['locality']) else r['town'].title() if r['town'].isupper() else r['town']
    s = {'dfe': r['code'], 'urn': r['urn'], 'name': RENAME.get(r['urn'], r['name']), 'place': PLACE_FIX.get(r['code'], loc or 'Halifax'),
         'method': 'straight_line', 'll': r['ll'], 'postcode': r['postcode'], 'addr': r['addr'],
         'web': WEB.get(r['code'], r['web']), 'of': ofsted(mi.get(f'{LA}{r["code"]}'), mi19), 'con': dfe[r['urn']].get('con'),
         'type': kind(r['kind'], r['faith'] if r['faith'] not in ('Does not apply', 'None') else None),
         'own': OWN_RULES(r['kind']), 'src': SRC, 'loc': r['locality'], 'town': r['town'], 'reg': r['name']}
    s['d'] = [x for x in (year_rec(s, r, y) for y in YEARS) if x]
    if any(x.get('g') in ('in', 'out') for x in s['d']):
        s['cu'] = True   # an academy with its own catchment, which the council doesn't map
    if len(s['d']) < len(YEARS):
        print(f'  {s["name"]} ({s["dfe"]}): only {[x["y"] for x in s["d"]]} in the council figures')
    s['pan'] = next((row(s, y)['pan'] for y in YEARS if row(s, y)), None)
    schools.append(s)
used = {(key(row(s, y)['name']), y) for s in schools for y in YEARS if row(s, y)}
for s in schools:
    del s['loc'], s['town'], s['reg']

for k, v in council.items():
    if k[1] == YEARS[0] and k not in used:
        print(f'  in the council figures but not matched: {v["name"]}')

out = {'schools': sorted(schools, key=lambda s: s['name']), 'catch': [],
       'sources': [{'year': y, 'url': SRC} for y in YEARS], 'updated': datetime.date.today().isoformat()}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(f'{len(schools)} schools, {sum(1 for s in schools if any(x["s"] == "distance" for x in s["d"]))} oversubscribed in a year, '
      f'{len(json.dumps(out, separators=(",", ":"))) // 1024} KB')
