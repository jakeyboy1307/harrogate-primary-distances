"""Build the Hull (Kingston upon Hull) school data, in the same shape as build_data.py's North Yorkshire file.

Usage:  python3 -I build/build_hull.py <er-raw-dir> <ny-raw-dir> <out.json>

<er-raw-dir> holds build/fetch_eastriding.sh's national register (gias.csv); <ny-raw-dir> holds build/fetch.sh's
national files (ofsted.csv, ofsted2019.csv, dfe-offers.csv). build/hull/allocations.json comes from the council's
guide (build/hull_guide.py). Needs pyproj. Every school's place is Hull: its area pages split the city in three.

Hull publishes no cut-off distances, and its catchments only as a scanned map, so:
- every year is a DfE "firsts" record: how many put the school first, and how many of them got it;
- the guide adds each school's admission number and how the latest year's places went (catchment, brothers and
  sisters, distance, other), shown as a note;
- schools whose places went partly by catchment are marked cu (a catchment the checker can't check).
"""
import csv, datetime, json, os, re, sys
from pyproj import Transformer

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # common.py, which isolated mode (-I) won't find on its own
from common import OWN_RULES, firsts_year, kind, ofsted, read_dfe, read_mi

RAW, NY, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
HERE = os.path.dirname(os.path.abspath(__file__))
YEARS = (2026, 2025, 2024, 2023)
LA = '810'
COUNCIL = 'Kingston upon Hull, City of'
SRC = 'https://explore-education-statistics.service.gov.uk/find-statistics/primary-and-secondary-school-applications-and-offers'
TYPES = {'Community school': 'Community School', 'Voluntary controlled school': 'Voluntary Controlled',
         'Voluntary aided school': 'Voluntary Aided', 'Foundation school': 'Foundation', 'Academy converter': 'Academy',
         'Academy sponsor led': 'Academy', 'Free schools': 'Free School'}
# A school whose DfE figures are under the number it had before becoming an academy (St Andrew's, August 2026)
PREDECESSOR = {'152562': '118051'}
# The guide's postcode where it differs from the register's
GUIDE_POSTCODE = {'HU46DT': 'Eastfield Primary School'}
# School websites the register has wrong (build/check_websites.py, 10 November 2026): Alderman Cogan's old domain now
# belongs to a gambling site; the others have moved to their trusts' addresses
WEB = {3509: 'https://aldermancogan.ebor.academy/', 2160: 'https://www.eastfieldprimary.org.uk/', 2006: 'https://www.liftgreenway.org/', 2007: 'https://www.lifthallroad.org/', 2684: 'https://www.thoresbyprimaryschool.org.uk/', 2010: 'https://wansbeckprimary.org.uk/'}

to_ll = Transformer.from_crs(27700, 4326, always_xy=True)
mi, mi19 = read_mi(f'{NY}/ofsted.csv'), read_mi(f'{NY}/ofsted2019.csv')
dfe = read_dfe(f'{NY}/dfe-offers.csv', {COUNCIL})
figs = lambda urn: dfe.get(urn) or dfe.get(PREDECESSOR.get(urn, ''))
guide = json.load(open(f'{HERE}/hull/allocations.json'))
letters = lambda n: re.sub(r'[^a-z]', '', n.lower().replace('school', '').replace('academy', '').replace('churchofengland', 'ce')
                            .replace('voluntarycatholic', '').replace('vc', ''))

# ---------- schools: the register's open primary schools with a Reception intake ----------
rows = [r for r in csv.DictReader(open(f'{RAW}/gias.csv', encoding='cp1252'))
        if r['LA (code)'] == LA and r['EstablishmentStatus (name)'].startswith('Open')
        and r['PhaseOfEducation (name)'] in ('Primary', 'All-through') and (figs(r['URN']) or {}).get('years', {}).get(2026)]

def guide_row(r):
    pc = r['Postcode'].replace(' ', '').upper()
    for g in guide['schools']:
        gp = (g['postcode'] or '').replace(' ', '').upper()
        if GUIDE_POSTCODE.get(gp) == r['EstablishmentName'] or (len(letters(g['name'])) > 5 and letters(r['EstablishmentName']).startswith(letters(g['name'])[:12])):
            return g
    return next((g for g in guide['schools'] if g['postcode'] and pc.startswith(g['postcode'].replace(' ', '').upper())), None)


schools = []
for r in rows:
    code = int(r['EstablishmentNumber'])
    lng, lat = to_ll.transform(float(r['Easting']), float(r['Northing']))
    web = r['SchoolWebsite'].strip()
    if web and not web.startswith('http'):
        web = 'https://' + web
    g = guide_row(r)
    if not g:
        print(f'  not in the guide: {r["EstablishmentName"]}')
    s = {'dfe': code, 'urn': r['URN'], 'name': re.sub(r'\s+-\s+a Catholic voluntary academy$', '', r['EstablishmentName'], flags=re.I),
         'place': 'Hull', 'kind': TYPES[r['TypeOfEstablishment (name)']], 'faith': r['ReligiousCharacter (name)'],
         'method': 'walking', 'd': [], 'll': [round(lat, 6), round(lng, 6)], 'postcode': r['Postcode'],
         'addr': ', '.join(x for x in (r['Street'], r['Locality'], r['Town'], r['Postcode']) if x),
         'web': WEB.get(code, web or None), 'of': ofsted(mi.get(f'{LA}{code}'), mi19), 'con': figs(r['URN']).get('con'),
         'pan': g and g['pan']}
    for y in YEARS:
        d = figs(r['URN'])['years'].get(y)
        if not d:
            continue
        rec = firsts_year(y, d)
        if g and y == guide['year']:
            parts = [(g.get('catchment'), 'to children in the catchment'), (g.get('sibling'), 'to brothers and sisters'),
                     (g.get('distance'), 'by distance'), (g.get('other'), 'by the school’s other rules'),
                     ((g.get('sen') or 0) + (g.get('cla') or 0), 'to children in care or with an education, health and care plan')]
            parts = [f'{n} {w}' for n, w in parts if n]
            if parts:
                rec['n'] = 'places went ' + ', '.join(parts[:-1]) + (' and ' if len(parts) > 1 else '') + parts[-1] + ' (Hull City Council’s guide)'
        s['d'].append(rec)
    if g and g.get('catchment'):
        s['cu'] = True   # its places go partly by catchment, but Hull's catchments can't be checked
    schools.append(s)

# ---------- tidy ----------
for s in schools:
    s['type'] = kind(s['kind'], s['faith'] if s['faith'] not in ('Does not apply', 'None') else None)
    s['own'] = OWN_RULES(s['kind'])
    s['src'] = SRC
    for k in ('kind', 'faith'):
        s.pop(k)

out = {'schools': sorted(schools, key=lambda s: s['name']), 'catch': [],
       'sources': [{'year': y, 'url': SRC} for y in YEARS], 'updated': datetime.date.today().isoformat()}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(f'{len(schools)} schools, {sum(1 for s in schools if s.get("cu"))} with a catchment that can’t be checked, '
      f'{len(json.dumps(out, separators=(",", ":"))) // 1024} KB')
