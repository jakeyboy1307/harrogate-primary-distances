"""Build the Barnsley school data, in the same shape as build_data.py's North Yorkshire file.

Usage:  python3 -I build/build_barnsley.py <raw-dir> <ny-raw-dir> <out.json>

<raw-dir> holds build/fetch_barnsley.sh's gias.csv; <ny-raw-dir> holds build/fetch.sh's national files (ofsted.csv,
ofsted2019.csv, dfe-offers.csv). Who got in, 2024 to 2026, comes from build/barnsley/allocations.json
(build/barnsley_guide.py). Needs pyproj.

Barnsley's primary schools have no catchment areas: the council's schools give places to children with an education,
health and care plan, then children in care, then brothers and sisters, then the children who live nearest, in a
straight line. Church schools and some academies set their own rules (faith, parish, a village). So, for each year in
the council's guides:
- a school not on the guide's oversubscribed list took everyone who applied ("all_offered");
- a full school on the council's rules: brothers and sisters, then children within the last distance offered ("near");
- a full school on its own rules: by those rules, to the last distance ("crit").
2023, and any full school whose places by distance the guide doesn't show, is the DfE's first-choice figures.
"""
import csv, datetime, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # common.py, which isolated mode (-I) won't find on its own
from common import DFE_SRC, OWN_RULES, firsts_year, kind, ofsted, read_dfe, read_mi, register_schools, successors

RAW, NY, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
HERE = os.path.dirname(os.path.abspath(__file__))
YEARS = (2026, 2025, 2024, 2023)
LA, COUNCIL = '370', 'Barnsley'
GUIDE = {2026: 'https://www.barnsley.gov.uk/media/sydlk4be/pimary-school-admission-booklet-2027.pdf',
         2025: 'https://www.barnsley.gov.uk/media/locjtvek/primary-school-admissions-2026-booklet.pdf',
         2024: 'https://web.archive.org/web/20250405215724/https://www.barnsley.gov.uk/media/024n1s3g/bmbc-primary-admissions-booklet_web_1.pdf'}
MI = 1609.344
# School websites the register has wrong or lacks (build/check_websites.py, 11 November 2026): Gawber's and Sandhill's
# domains have lapsed and are for sale, so they have none; Ward Green's, Jump's and the two Lift schools' have moved;
# Holy Trinity and Outwood Darfield weren't listed
WEB = {2109: None, 2068: None, 2056: 'https://www.wardgreenprimary.org/', 2085: 'https://jumpprimaryacademy.org/', 4011: 'https://holytrinitybarnsley.org/', 2022: 'https://www.liftmeadstead.org/', 2016: 'https://www.liftsthelens.org/', 2049: 'https://www.darfield.outwood.com/'}
# The register's locality where it's a street or estate rather than the village or part of the town
PLACE_FIX = {2010: 'Thurnscoe'}   # Gooseacre: "Off Merrill Road, Rotherham, S63 0NU"
# Where the register gives only "Barnsley", the school's council ward (build/barnsley/wards.json, from postcodes.io)
WARDS = json.load(open(f'{HERE}/barnsley/wards.json'))
WARD_PLACE = {'Central': 'Barnsley town centre'}
# A guide name that doesn't come down to the register's: the school's number
GUIDE_SCHOOL = {'Cudworth Churchfield Primary School': 2134, 'Worsbrough Bank End Primary Academy': 2099, 'Worsbrough Bank End Primary School': 2099,
                'Shafton Primary Academy': 2015, 'Meadstead Primary Academy': 2022, 'Milhouse Primary School': 2077,
                'St Michaels and All Angels Catholic Primary School': 3318, 'St Helen’s Primary Academy': 2016}   # the register's Churchfield, Bank End, "Lift Shafton", "Lift Meadstead", Millhouse
# Academies whose DfE figures before conversion are under a closed school with a different number: the old school's URN
OLD_URN = {'150020': '106585', '152063': '131459'}   # Hoylandswaine (renumbered 2023), Summer Lane (2025)


def place_of(r, loc):
    if r['code'] in PLACE_FIX:
        return PLACE_FIX[r['code']]
    if loc and loc not in ('Barnsley', 'Rotherham', 'Sheffield') and not loc.startswith('Off '):
        return loc
    ward = WARDS.get(r['postcode'])
    return WARD_PLACE.get(ward, re.split(r' & |, ', ward)[0]) if ward else 'Barnsley'


mi, mi19 = read_mi(f'{NY}/ofsted.csv'), read_mi(f'{NY}/ofsted2019.csv')
dfe = read_dfe(f'{NY}/dfe-offers.csv', {COUNCIL})
taking = {u for u, d in dfe.items() if 2026 in d['years']}
PRED = successors(f'{RAW}/gias.csv', LA, taking)
NUMBER, CLOSED = {}, {}   # earlier academy conversions: the DfE's older years are under the closed school with the same number
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
schools = []
for r in reg:
    loc = r['locality'] if r['locality'] and not STREET.search(r['locality']) else r['town'].title() if r['town'].isupper() else r['town']
    f = figs(r['urn'])
    s = {'dfe': r['code'], 'urn': r['urn'], 'name': re.sub(r'\s+-\s+a Catholic voluntary academy$', '', r['name'], flags=re.I),
         'place': place_of(r, loc), 'method': 'straight_line', 'll': r['ll'], 'postcode': r['postcode'], 'addr': r['addr'],
         'web': WEB.get(r['code'], r['web']), 'of': ofsted(mi.get(f'{LA}{r["code"]}'), mi19),
         'con': f['con'] if f['con'] and f['con'] != 'n/a' else None,
         'type': kind(r['kind'], r['faith'] if r['faith'] not in ('Does not apply', 'None') else None),
         'own': OWN_RULES(r['kind']), 'src': GUIDE[2026], 'pan': None, 'years': f['years']}
    if not s['con']:
        print(f'  no constituency: {s["name"]} ({s["dfe"]}), {s["postcode"]}')
    schools.append(s)

# ---------- matching the guides' names ----------
letters = lambda n: re.sub(r'[^a-z]', '', n.lower().replace('’', "'").replace("'", ''))
DROP = (r'\b(Church of England|C of E|CofE|CE|Catholic|Voluntary|Controlled|Aided|Primary|Junior and Infant|School|Academy|'
        r'Learning Centre|Infant|Junior|St|Saint|Nursery|The|and)\b|\(.*?\)')
norm = lambda n: letters(re.sub(DROP, ' ', n, flags=re.I))


def school_named(n):
    """The one school a guide name means: the same once faith, status and type words are dropped, else one starts the other."""
    if n in GUIDE_SCHOOL:
        return [s for s in schools if s['dfe'] == GUIDE_SCHOOL[n]]
    hit = [s for s in schools if norm(s['name']) == norm(n)]
    return hit or [s for s in schools if norm(s['name']).startswith(norm(n)) or norm(n).startswith(norm(s['name']))]


guides = {int(y): v for y, v in json.load(open(f'{HERE}/barnsley/allocations.json')).items()}
APPX, OVER = {}, {}   # (year, URN) -> the school's appendix entry, and its last distance if it was oversubscribed
for y, v in guides.items():
    for a in v['schools']:
        hit = school_named(a['name'])
        if len(hit) != 1:
            print(f'  {y} appendix {a["name"]!r}: {len(hit)} schools {[s["name"] for s in hit]}')
            continue
        if (y, hit[0]['urn']) in APPX:
            print(f'  {y}: {a["name"]!r} and {APPX[(y, hit[0]["urn"])]["name"]!r} both match {hit[0]["name"]}')
        APPX[(y, hit[0]['urn'])] = a
    for n, d in v['over'].items():
        hit = school_named(n)
        if len(hit) != 1:
            print(f'  {y} oversubscribed {n!r}: {len(hit)} schools {[s["name"] for s in hit]}')
            continue
        if (y, hit[0]['urn']) in OVER:
            print(f'  {y}: two oversubscribed names match {hit[0]["name"]}')
        OVER[(y, hit[0]['urn'])] = d


def year_rec(s, y, d):
    d = d or {}
    a = APPX.get((y, s['urn']))
    if not a:
        return firsts_year(y, d) if d else None
    rec = {'y': y, **{k: d[k] for k in ('a', 'f') if d.get(k) is not None}, 'o': a.get('total'), 'p': a.get('places')}
    rec = {k: v for k, v in rec.items() if v is not None}
    far = OVER.get((y, s['urn']))
    if far is None:
        return {**rec, 's': 'all_offered'}   # not on the guide's list of oversubscribed schools
    if a['rules']:
        return {**rec, 's': 'distance', 'g': 'crit', 'm': round(far * MI), 'mi': far}   # the school's own rules
    if a.get('dist'):
        return {**rec, 's': 'distance', 'g': 'near', 'm': round(far * MI), 'mi': far}
    return firsts_year(y, d) if d else None


for s in schools:
    years = s.pop('years')
    s['d'] = [x for x in (year_rec(s, y, years.get(y)) for y in YEARS) if x]
    s['pan'] = next((APPX[(y, s['urn'])].get('places') for y in (2026, 2025, 2024) if (y, s['urn']) in APPX), None)
    if len(s['d']) < len(YEARS):
        print(f'  {s["name"]} ({s["dfe"]}): only {[x["y"] for x in s["d"]]}')
    # a full school the national figures show had no refusals, or the other way round, is worth a look
    for x in s['d']:
        dy = years.get(x['y']) or {}
        if x['s'] == 'all_offered' and dy.get('fo') is not None and dy['fo'] < dy.get('f', 0) - 1:
            print(f'  {x["y"]} {s["name"]}: the guide says not full, the DfE says {dy["f"] - dy["fo"]} first choices refused')

out = {'schools': sorted(schools, key=lambda s: s['name']), 'catch': [],
       'sources': [{'year': y, 'url': GUIDE.get(y, DFE_SRC)} for y in YEARS], 'updated': datetime.date.today().isoformat()}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(f'{len(schools)} schools, {len(json.dumps(out, separators=(",", ":"))) // 1024} KB')
