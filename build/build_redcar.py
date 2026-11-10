"""Build the Redcar and Cleveland school data, in the same shape as build_data.py's North Yorkshire file.

Usage:  python3 -I build/build_redcar.py <raw-dir> <ny-raw-dir> <out.json>

<raw-dir> holds gias.csv (the national register, from build/fetch_eastriding.sh); <ny-raw-dir> holds build/fetch.sh's
national files (ofsted.csv, ofsted2019.csv, dfe-offers.csv). Needs pyproj.

Redcar and Cleveland publishes no figures on who got a place, and most of its schools are academies with their own
rules. Each school's "admission zone" isn't published as a map (the council's guide says to ask the school), so
zones aren't checked. Every year is a DfE "firsts" record: how many put the school first, and how many of them got it.
"""
import datetime, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # common.py, which isolated mode (-I) won't find on its own
from common import DFE_SRC, OWN_RULES, firsts_year, kind, ofsted, read_dfe, read_mi, register_schools

RAW, NY, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
YEARS = (2026, 2025, 2024, 2023)
LA, COUNCIL = '807', 'Redcar and Cleveland'
# School websites the register has wrong or lacks (build/check_websites.py, 10 November 2026): the Ironstone trust moved Nunthorpe and Normanby to .org.uk; Riverdale and Normanby weren’t listed
WEB = {2000: 'https://highcliffeprimary.org/', 2166: 'https://nunthorpe.ironstoneacademy.org.uk/', 2233: 'https://wilton.teesvalleyeducation.co.uk/', 2352: 'https://normanby.ironstoneacademy.org.uk/', 2340: 'https://www.riverdaleprimary.co.uk/'}
# The register's locality where it's a street or estate rather than the town or village
PLACE_FIX = {2357: 'Marske-by-the-Sea', 3307: 'Marske-by-the-Sea', 2088: 'Guisborough', 2166: 'Nunthorpe'}

mi, mi19 = read_mi(f'{NY}/ofsted.csv'), read_mi(f'{NY}/ofsted2019.csv')
dfe = read_dfe(f'{NY}/dfe-offers.csv', {COUNCIL})
reg = register_schools(f'{RAW}/gias.csv', LA, {u for u, d in dfe.items() if 2026 in d['years']})
STREET = re.compile(r'\b(road|lane|street|avenue|grove|close|crescent|way|terrace|walk|drive|gardens|place|row)$|\d', re.I)

schools = []
for r in reg:
    loc = r['locality'] if r['locality'] and not STREET.search(r['locality']) else r['town'].title() if r['town'].isupper() else r['town']
    s = {'dfe': r['code'], 'urn': r['urn'], 'name': re.sub(r'\s+-\s+a Catholic voluntary academy$', '', r['name'], flags=re.I),
         'place': PLACE_FIX.get(r['code'], loc), 'method': 'straight_line', 'll': r['ll'], 'postcode': r['postcode'], 'addr': r['addr'],
         'web': WEB.get(r['code'], r['web']), 'of': ofsted(mi.get(f'{LA}{r["code"]}'), mi19), 'con': dfe[r['urn']].get('con'),
         'type': kind(r['kind'], r['faith'] if r['faith'] not in ('Does not apply', 'None') else None),
         'own': OWN_RULES(r['kind']), 'src': DFE_SRC, 'cu': True, 'pan': None}
    s['d'] = [firsts_year(y, dfe[r['urn']]['years'][y]) for y in YEARS if y in dfe[r['urn']]['years']]
    schools.append(s)

out = {'schools': sorted(schools, key=lambda s: s['name']), 'catch': [],
       'sources': [{'year': y, 'url': DFE_SRC} for y in YEARS], 'updated': datetime.date.today().isoformat()}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(f'{len(schools)} schools, {len(json.dumps(out, separators=(",", ":"))) // 1024} KB')
