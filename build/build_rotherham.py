"""Build the Rotherham school data, in the same shape as build_data.py's North Yorkshire file.

Usage:  python3 -I build/build_rotherham.py <raw-dir> <ny-raw-dir> <out.json>

<raw-dir> holds build/fetch_rotherham.sh's gias.csv; <ny-raw-dir> holds build/fetch.sh's national files (ofsted.csv,
ofsted2019.csv, dfe-offers.csv). Admission numbers, and how 2026's places went at the full schools, come from
build/rotherham/allocations.json (build/rotherham_guide.py). Needs no extra packages.

Rotherham's community schools give places to children in care, then children in the catchment (those with an older
brother or sister at the school first), then brothers and sisters, then the children who live nearest, in a straight
line; most academies do much the same. Every school has a catchment, but the council draws them only on its web map,
as pictures rather than data, so catchments aren't checked. Nor does it publish how far places went. So every year is a
DfE "firsts" record (how many put the school first, and how many of them got it), and 2026's carries a note from the
council's booklet for each school that was full: how many places were left for children applying on distance, and how
many of them missed out.
"""
import csv, datetime, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # common.py, which isolated mode (-I) won't find on its own
from common import DFE_SRC, OWN_RULES, firsts_year, kind, ofsted, read_dfe, read_mi, register_schools, successors

RAW, NY, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
HERE = os.path.dirname(os.path.abspath(__file__))
YEARS = (2026, 2025, 2024, 2023)
LA, COUNCIL = '372', 'Rotherham'
BOOKLET = 'https://www.rotherham.gov.uk/downloads/file/5088/primary-application-booklet-pdf-'
SRC = "Rotherham Council’s booklet"
# School websites the register lacks (build/check_websites.py, 11 November 2026), from the council's booklet
WEB = {2046: 'https://www.brinsworthmanorinfants.co.uk/', 2044: 'https://www.foljambeprimary.co.uk/', 2135: 'https://www.greasbroughprimary.com/'}
# The register's locality where it's a street or estate rather than the town or village
PLACE_FIX = {2006: 'Broom', 3322: 'Herringthorpe', 2031: 'Wingfield', 2039: 'Waverley'}
# Where the register gives only "Rotherham", the school's council ward (build/rotherham/wards.json, from postcodes.io),
# by its first name ("Anston" in Anston & Woodsetts)
WARDS = json.load(open(f'{HERE}/rotherham/wards.json'))
WARD_PLACE = {'Boston Castle': 'Rotherham town centre', 'Rotherham East': 'Rotherham', 'Rotherham West': 'Rotherham',
              'Keppel': 'Kimberworth', 'Hoober': 'Wentworth', 'Rother Vale': 'Catcliffe', 'Sitwell': 'Moorgate'}
# A booklet name that doesn't come down to the register's: the school's number
BOOK_SCHOOL = {}
# Admission numbers the booklet's table doesn't give in one figure: Brampton the Ellis gives 40 (infant) and 90 (junior)
PAN_FIX = {3331: 40}
# Academies whose DfE figures before conversion are under a closed school with a different number: the old school's URN
OLD_URN = {'151486': '106864'}   # Brinsworth Manor Infant (renumbered April 2025)


def place_of(r, loc):
    if r['code'] in PLACE_FIX:
        return PLACE_FIX[r['code']]
    if loc and loc not in ('Rotherham', 'Sheffield', 'Doncaster', 'Mexborough'):
        return loc
    ward = WARDS.get(r['postcode'])
    return WARD_PLACE.get(ward, re.split(r' & |, ', ward)[0]) if ward else 'Rotherham'


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


# ---------- matching the booklet's names ----------
letters = lambda n: re.sub(r'[^a-z]', '', n.lower().replace('’', "'").replace("'", ''))
DROP = (r'\b(Church of England|C of E|CofE|CE|Catholic|Primary|Junior (&|and) Infant|Nursery (&|and) Infant|School|Academy|'
        r'Community|Infant|Junior|St|Saint|Nursery|The|and)\b|\.|\(.*?\)')
norm = lambda n: letters(re.sub(DROP, ' ', n, flags=re.I))
book = json.load(open(f'{HERE}/rotherham/allocations.json'))
by_pc = {}
for b in book['schools']:
    by_pc.setdefault(b['postcode'], []).append(b)


def book_row(s):
    """The school's row in the booklet's table: by postcode, and where two schools share one, by name."""
    hits = by_pc.get(s['postcode'].replace(' ', ''), [])
    if len(hits) > 1:
        hits = [b for b in hits if norm(b['name']) == norm(s['name'])] or [b for b in hits if norm(b['name']) in norm(s['name'])]
        if len(hits) > 1:   # an infant school and its junior school: the one taking Reception
            hits = [b for b in hits if 'JUNIOR' not in b['name'] or '&' in b['name']]
    # by name where the booklet's postcode differs from the register's (Swinton Fitzwilliam, Brampton the Ellis);
    # "(HERRINGTHORPE)" in the booklet's name tells two St Mary's apart, so it stays
    hits = hits or [b for b in book['schools'] if norm(b['name'].replace('THE ', '')) == norm(s['name'])
                    and (not re.search(r'\(', b['name']) or letters(re.search(r'\((.*?)\)', b['name']).group(1)) in letters(s['addr'] + s['place']))]
    return hits[0] if len(hits) == 1 else None


def note(f):
    """How the booklet says the year's last places went at a full school."""
    if f['kind'] == 'va':
        return f'{f["apps"]} applied by the closing date and {f["refused"]} missed out ({SRC})'
    if f['kind'] == 'catch':
        also = f.get('also', {})
        others = [f'{also["sibling"]} brothers and sisters from outside it'] if also.get('sibling') else []
        others += [f'{also["distance"]} other children'] if also.get('distance') else []
        return (f'the last places went to children in the catchment, and {f["refused"]} of them missed out'
                + (', as did ' + ' and '.join(others) if others else '') + f' ({SRC})')
    last = f'the last {f["left"]} places' if f['left'] != 1 else 'the last place'
    return f'after children with a higher priority, {last} went to the nearest of {f["apps"]} children, so {f["refused"]} missed out ({SRC})'


reg = register_schools(f'{RAW}/gias.csv', LA, taking | set(PRED) | set(OLD_URN))
STREET = re.compile(r'\b(road|lane|street|avenue|grove|close|crescent|way|terrace|walk|drive|gardens|place|row)$|\d', re.I)
schools, unmatched = [], []
for r in reg:
    loc = r['locality'] if r['locality'] and not STREET.search(r['locality']) else r['town'].title() if r['town'].isupper() else r['town']
    f = figs(r['urn'])
    s = {'dfe': r['code'], 'urn': r['urn'], 'name': re.sub(r'\s+-\s+a Catholic voluntary academy$', '', r['name'], flags=re.I),
         'place': place_of(r, loc), 'method': 'straight_line', 'll': r['ll'], 'postcode': r['postcode'], 'addr': r['addr'],
         'web': WEB.get(r['code'], r['web']), 'of': ofsted(mi.get(f'{LA}{r["code"]}'), mi19),
         'con': f['con'] if f['con'] and f['con'] != 'n/a' else None,
         'type': kind(r['kind'], r['faith'] if r['faith'] not in ('Does not apply', 'None') else None),
         'own': OWN_RULES(r['kind']), 'src': DFE_SRC, 'cu': True, 'pan': None, 'years': f['years']}
    b = book_row(s)
    if b:
        s['pan'] = PAN_FIX.get(s['dfe'], b['pan'])
    elif s['dfe'] in PAN_FIX:   # Brampton the Ellis's row has its postcode cut short too
        s['pan'] = PAN_FIX[s['dfe']]
    else:
        unmatched.append(f'{s["name"]} ({s["dfe"]}), {s["postcode"]}')
    if not s['con']:
        print(f'  no constituency: {s["name"]} ({s["dfe"]}), {s["postcode"]}')
    schools.append(s)
print('  not in the booklet\'s table:', unmatched)


def school_named(n):
    if n in BOOK_SCHOOL:
        return [s for s in schools if s['dfe'] == BOOK_SCHOOL[n]]
    hit = [s for s in schools if norm(s['name']) == norm(n)]
    hit = hit or [s for s in schools if norm(s['name']).startswith(norm(n)) or norm(n).startswith(norm(s['name']))]
    return hit or [s for s in schools if norm(n) in norm(s['name'])]   # "Thorogate": Rawmarsh Thorogate Junior & Infant


NOTES = {}
for f in book['full']:
    hit = school_named(f['name'])
    if len(hit) != 1:
        print(f'  full in {book["year"]}: {f["name"]!r} matches {[s["name"] for s in hit]}')
        continue
    if hit[0]['urn'] in NOTES:
        print(f'  two booklet rows match {hit[0]["name"]}')
    NOTES[hit[0]['urn']] = note(f)

for s in schools:
    years = s.pop('years')
    s['d'] = []
    for y in YEARS:
        if y not in years:
            continue
        rec = firsts_year(y, years[y])
        if y == book['year'] and s['urn'] in NOTES:
            rec['n'] = NOTES[s['urn']]
        s['d'].append(rec)
    if len(s['d']) < len(YEARS):
        print(f'  {s["name"]} ({s["dfe"]}): only {[x["y"] for x in s["d"]]}')
    # a school the booklet says was full where the DfE says every first choice got in, or the other way round
    d26 = years.get(book['year']) or {}
    if d26.get('f') and d26.get('fo') is not None:
        refused = d26['f'] - d26['fo']
        if s['urn'] in NOTES and refused == 0:
            print(f'  {s["name"]}: full in the booklet, but every first choice got in')
        if s['urn'] not in NOTES and refused > 2:
            print(f'  {s["name"]}: not in the booklet\'s full list, but {refused} first choices missed out')

out = {'schools': sorted(schools, key=lambda s: s['name']), 'catch': [],
       'sources': [{'year': y, 'url': DFE_SRC} for y in YEARS], 'updated': datetime.date.today().isoformat()}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(f'{len(schools)} schools, {len(NOTES)} with a note from the booklet, {len(json.dumps(out, separators=(",", ":"))) // 1024} KB')
