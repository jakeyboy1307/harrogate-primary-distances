"""Build the Middlesbrough school data, in the same shape as build_data.py's North Yorkshire file.

Usage:  python3 -I build/build_middlesbrough.py <raw-dir> <ny-raw-dir> <out.json>

<raw-dir> holds gias.csv (the national register, from build/fetch_eastriding.sh) and stats.pdf, the council's
"School admission statistics" (https://www.middlesbrough.gov.uk/media/vuxofasc/school-admissions-statistics-2022-2026.pdf);
<ny-raw-dir> holds build/fetch.sh's national files (ofsted.csv, ofsted2019.csv, dfe-offers.csv). Needs pyproj, and
pdftotext on the path.

The statistics give, for each school and year: its admission number, whether anyone was refused, offers, waiting
list, the criterion the last place went to, and that child's straight-line distance in miles. In the council's order
(children in care, then the admission zone, then brothers and sisters, then distance, with Catholic schools' faith
criteria first) that reads straight into who got in:
- nobody refused, or the last place went to a late applicant: everyone who applied on time got in;
- last place by distance: everyone in the zone, and others within that distance;
- last place to a brother or sister: everyone in the zone, and brothers and sisters from outside it;
- last place in the zone: only zone children (not all of them, if the distance is short);
- faith schools' "other children" and the like: by the school's own rules, to that distance.
Every home is in two admission zones (one faith, one not), published only as a PDF map, so zones aren't checked.
"""
import datetime, json, os, re, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # common.py, which isolated mode (-I) won't find on its own
from common import OWN_RULES, kind, ofsted, read_dfe, read_mi, register_schools

RAW, NY, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
YEARS = (2026, 2025, 2024, 2023)
LA, COUNCIL, MI = '806', 'Middlesbrough', 1609.344
SRC = 'https://www.middlesbrough.gov.uk/schools-and-education/school-admissions/school-admissions-allocation-statistics/'
# School websites the register has wrong or lacks (build/check_websites.py, 10 November 2026): the Lift trust moved both to its own addresses
WEB = {2102: 'https://www.liftcaldicotes.org/', 2143: 'https://www.liftnorthormesby.org/'}
# The register's locality where it's a street or ward rather than the part of town
PLACE_FIX = {'Gresham Ward': 'Middlesbrough', 'Coulby Farm Way': 'Coulby Newham', 'Brambles': 'Brambles Farm', 'Marton Manor': 'Marton'}

mi, mi19 = read_mi(f'{NY}/ofsted.csv'), read_mi(f'{NY}/ofsted2019.csv')
dfe = read_dfe(f'{NY}/dfe-offers.csv', {COUNCIL})
reg = register_schools(f'{RAW}/gias.csv', LA, {u for u, d in dfe.items() if 2026 in d['years']})

# ---------- the council's statistics, one table a year ----------
text = subprocess.run(['pdftotext', '-layout', f'{RAW}/stats.pdf', '-'], capture_output=True, text=True).stdout
ROW = re.compile(r'^\s*(\d{4})\s+(.+?)\s+(\d+)(?:\s*\([^)]*\))?\s+([YN])\s+(\d+)\s+(\d+|N/A)\s+(.+?)\s+([\d.]+|Not Known)\s*$')
stats, year = {}, None
for line in text.splitlines():
    m = re.search(r'Middlesbrough (Primary|Secondary) National Offer Day.*?(?:Reception|Y7) September (\d{4})', line)
    if m:
        year = int(m.group(2)) if m.group(1) == 'Primary' else None
        continue
    m = ROW.match(line)
    if year and m:
        code, name, pan, over, offers, wait, crit, dist = m.groups()
        stats[(int(code), year)] = {'name': name, 'pan': int(pan), 'over': over == 'Y', 'o': int(offers),
                                    'wait': 0 if wait == 'N/A' else int(wait), 'crit': crit.strip(),
                                    'mi': None if dist == 'Not Known' else float(dist)}
for y in YEARS:
    n = sum(1 for k in stats if k[1] == y)
    print(f'  {y}: {n} schools in the council table')

# Schools that became academies have new numbers; their earlier rows are found by name
key = lambda n: re.sub(r'(primary|school|academy|catholic|rc|r\.c\.?|st\.?|saint|the|lift|community|mainstream)', '', re.sub(r'[^a-z. ]', '', n.lower())).replace(' ', '').replace('.', '')


def stat(s, y):
    t = stats.get((s['dfe'], y))
    if t:
        return t
    hits = [v for (c, yy), v in stats.items() if yy == y and key(v['name'])[:8] == key(s['name'])[:8]]
    return hits[0] if len(hits) == 1 else None


def year_rec(s, y):
    d = dfe.get(s['urn'], {}).get('years', {}).get(y) or {}
    t = stat(s, y)
    base = {'y': y, **{k: d[k] for k in ('a', 'f') if d.get(k) is not None}}
    if not t:
        return None
    rec = {**base, 'o': t['o'], 'p': t['pan']}
    crit = t['crit'].lower()
    if not t['over'] or crit.startswith('late') or 'late application' in crit:
        return {**rec, 's': 'all_offered'}   # nobody who applied on time was refused
    m = round(t['mi'] * MI) if t['mi'] is not None else None
    if 'other children' in crit or 'denomination' in crit or 'admission authority' in crit:
        g = 'crit'
    elif 'distance' in crit:
        g = 'out'
    elif 'sibling' in crit and 'catchment' not in crit:
        g = 'sib'
    elif 'catchment' in crit:
        g = 'in'
    else:
        print(f'  {y} {s["name"]}: last criterion "{t["crit"]}" not understood')
        return {**rec, 's': 'not_published'}
    if g in ('in', 'crit', 'out') and (m is None or (g == 'in' and m < 0.05 * MI)):
        note = 'only children in the admission zone got places' if g == 'in' else 'the council didn’t give the distance of the last place'
        return {**rec, 's': 'not_published', 'n': note}
    rec.update(s='distance', g=g)
    if m is not None and g != 'sib':
        rec['m'], rec['mi'] = m, t['mi']
    return rec


schools = []
for r in reg:
    name = re.sub(r'\s+-\s+a Catholic voluntary academy$', '', r['name'], flags=re.I)
    s = {'dfe': r['code'], 'urn': r['urn'], 'name': name, 'place': PLACE_FIX.get(r['locality'], r['locality']) or 'Middlesbrough',
         'method': 'straight_line', 'll': r['ll'], 'postcode': r['postcode'], 'addr': r['addr'],
         'web': WEB.get(r['code'], r['web']), 'of': ofsted(mi.get(f'{LA}{r["code"]}'), mi19), 'con': dfe[r['urn']].get('con'),
         'type': kind(r['kind'], r['faith'] if r['faith'] not in ('Does not apply', 'None') else None),
         'own': OWN_RULES(r['kind']), 'src': SRC, 'cu': True}
    s['d'] = [x for x in (year_rec(s, y) for y in YEARS) if x]
    if len(s['d']) < len(YEARS):
        print(f'  {name} ({s["dfe"]}): only {[x["y"] for x in s["d"]]} in the council tables')
    s['pan'] = next((stat(s, y)['pan'] for y in YEARS if stat(s, y)), None)
    schools.append(s)

out = {'schools': sorted(schools, key=lambda s: s['name']), 'catch': [],
       'sources': [{'year': y, 'url': SRC} for y in YEARS], 'updated': datetime.date.today().isoformat()}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(f'{len(schools)} schools, {len(json.dumps(out, separators=(",", ":"))) // 1024} KB')
