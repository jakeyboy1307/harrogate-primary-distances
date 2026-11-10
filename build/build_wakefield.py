"""Build the Wakefield school data, in the same shape as build_data.py's North Yorkshire file.

Usage:  python3 -I build/build_wakefield.py <raw-dir> <ny-raw-dir> <out.json>

<raw-dir> holds build/fetch_wakefield.sh's gias.csv; <ny-raw-dir> holds build/fetch.sh's national files (ofsted.csv,
ofsted2019.csv, dfe-offers.csv). How 2026's places went comes from build/wakefield/allocations.json
(build/wakefield_guide.py). Needs no extra packages.

Wakefield's schools give places to children in care, then children in the catchment (brothers and sisters first),
then brothers and sisters, then the children who live nearest, in a straight line. Every school has a catchment, but
the council publishes them only through an address search behind a reCAPTCHA, and its maps say they can't show the
full detail, so catchments aren't checked. Nor does it publish how far places went. So every year is a DfE "firsts"
record (how many put the school first, and how many of them got it), and 2026's carries a note from the council's
guide of how the places went: to the catchment, to brothers and sisters, and to others.
"""
import datetime, json, os, re, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))   # common.py, which isolated mode (-I) won't find on its own
from common import DFE_SRC, OWN_RULES, firsts_year, kind, ofsted, read_dfe, read_mi, register_schools, successors

RAW, NY, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
HERE = os.path.dirname(os.path.abspath(__file__))
YEARS = (2026, 2025, 2024, 2023)
LA, COUNCIL = '384', 'Wakefield'
GUIDE_SRC = 'https://www.wakefield.gov.uk/media/43xpw5x4/primaryguide-27-28.docx'
# School websites the register has wrong or lacks (build/check_websites.py, 10 November 2026): Three Lane Ends' link is to an
# old page, Horbury St Peter's has moved, Newton Hill's eschools address no longer redirects properly, Common Road's
# lacks a dot, St Botolph's and St Michael's work only on their other addresses. Smawthorne Henry Moore's old address
# doesn't answer and its new site is switched off, so it has none.
WEB = {2184: 'https://www.tleacademy.co.uk/', 3343: 'https://www.st-peters-wakefield.uk/', 2079: 'https://www.newtonhill.wakefield.sch.uk/website',
       2186: 'https://commonroadschool.org.uk/', 2029: 'https://www.stbotolphsacademy.co.uk/', 2004: 'https://www.stmichaelsceacademy.org.uk/',
       2208: None}
# The register's locality where it's a street or estate rather than the town or village, or where it gives only "Wakefield"
# and the school's part of it is plain from its address
PLACE_FIX = {3341: 'Ossett', 3019: 'Crigglestone', 2029: 'Knottingley', 2031: 'Havercroft', 3339: 'Sandal', 2159: 'Thornes',
             2154: 'Eastmoor', 2004: 'Flanshaw', 2162: 'Kettlethorpe'}
# Where the register gives only "Wakefield", the school's council ward (build/wakefield/wards.json, from postcodes.io),
# by its first name ("Wakefield North" stays whole)
WARDS = json.load(open(f'{HERE}/wakefield/wards.json'))
WARD_PLACE = {w: 'Wakefield' for w in ('Wakefield East', 'Wakefield West', 'Wakefield North', 'Wakefield South', 'Wakefield Rural')}
# Register names with an apostrophe missing or "St." for St
NAME_FIX = {2029: "St Botolph's CE Academy", 3015: "Stanley St Peter's Church of England Voluntary Controlled Primary School",
            3305: "Wakefield St John's Church of England Voluntary Aided Junior and Infant School",
            3338: "Wakefield St Mary's Church of England Voluntary Aided Primary School", 3330: 'St John the Baptist Catholic Primary School'}
# The guide's postcode where it differs from the register's
GUIDE_POSTCODE = {2101: 'WF110PL'}
# Academies whose DfE figures before conversion are under a closed school with a different number: the old school's URN
OLD_URN = {'150309': '130859', '150627': '108229'}   # Ark Northfield (Northfield Primary), Townville (Castleford Townville Infants)


def place_of(r, loc):
    if r['code'] in PLACE_FIX:
        return PLACE_FIX[r['code']]
    if loc and loc != 'Wakefield':
        return loc
    ward = WARDS.get(r['postcode'])
    return WARD_PLACE.get(ward, ward) if ward else 'Wakefield'


mi, mi19 = read_mi(f'{NY}/ofsted.csv'), read_mi(f'{NY}/ofsted2019.csv')
dfe = read_dfe(f'{NY}/dfe-offers.csv', {COUNCIL})
taking = {u for u, d in dfe.items() if 2026 in d['years']}
PRED = successors(f'{RAW}/gias.csv', LA, taking)


# Earlier academy conversions: the DfE's older years are under the closed school with the same number
import csv
NUMBER, CLOSED = {}, {}
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


reg = register_schools(f'{RAW}/gias.csv', LA, taking | set(PRED))
STREET = re.compile(r'\b(road|lane|street|avenue|grove|close|crescent|way|terrace|walk|drive|gardens|place|row)$|\d', re.I)
guide = json.load(open(f'{HERE}/wakefield/allocations.json'))
by_pc = {}
for g in guide['schools']:
    by_pc.setdefault(g['postcode'], []).append(g)


def guide_row(s):
    pc = GUIDE_POSTCODE.get(s['dfe'], s['postcode'].replace(' ', ''))
    hits = by_pc.get(pc, [])
    if len(hits) > 1:   # two schools at one postcode: the one whose name starts the same, or (unnamed in the guide) whose website does
        letters = lambda x: re.sub(r'\W', '', (x or '').lower())
        site = lambda x: re.sub(r'^(https?://)?(www\.)?', '', (x or '').lower()).split('/')[0]
        hits = ([g for g in hits if letters(g['name'])[:8] == letters(s['name'])[:8]]
                or [g for g in hits if g.get('web') and site(g['web']) == site(s['web'])])
    return hits[0] if len(hits) == 1 else None


def note(g):
    """How the guide says the year's places went, in the council's categories, or None for a school's own lettered rules."""
    if 'letters' in g:
        return None
    parts = [(g.get('catch_sib', 0) + g.get('catch', 0), 'to children in the catchment'), (g.get('sib'), 'to brothers and sisters outside it'),
             (g.get('other'), 'to other children, nearest first'), (g.get('cla', 0) + g.get('ehcp', 0), 'to children in care or with an education, health and care plan'),
             (g.get('placed'), 'to children placed by the council because none of their choices had room')]
    parts = [f'{n} {w}' for n, w in parts if n]
    if not parts:
        return None
    return 'places went ' + ', '.join(parts[:-1]) + (' and ' if len(parts) > 1 else '') + parts[-1] + ' (Wakefield Council’s guide)'


schools, unmatched = [], []
for r in reg:
    loc = r['locality'] if r['locality'] and not STREET.search(r['locality']) else r['town'].title() if r['town'].isupper() else r['town']
    f = figs(r['urn'])
    s = {'dfe': r['code'], 'urn': r['urn'], 'name': NAME_FIX.get(r['code'], re.sub(r'\s+-\s+a Catholic voluntary academy$', '', r['name'], flags=re.I)),
         'place': place_of(r, loc), 'method': 'straight_line', 'll': r['ll'], 'postcode': r['postcode'], 'addr': r['addr'],
         'web': WEB.get(r['code'], r['web']), 'of': ofsted(mi.get(f'{LA}{r["code"]}'), mi19),
         'con': f['con'] if f['con'] and f['con'] != 'n/a' else None,
         'type': kind(r['kind'], r['faith'] if r['faith'] not in ('Does not apply', 'None') else None),
         'own': OWN_RULES(r['kind']), 'src': DFE_SRC, 'cu': True, 'pan': None}
    g = guide_row(s)
    if g:
        s['pan'] = g['pan']
    else:
        unmatched.append(f'{s["name"]} ({s["dfe"]}), {s["postcode"]}')
    s['d'] = []
    for y in YEARS:
        if y not in f['years']:
            continue
        rec = firsts_year(y, f['years'][y])
        if g and y == guide['year'] and (n := note(g)):
            rec['n'] = n
        s['d'].append(rec)
    if len(s['d']) < len(YEARS):
        print(f'  {s["name"]} ({s["dfe"]}): only {[x["y"] for x in s["d"]]}')
    if not s['con']:
        print(f'  no constituency: {s["name"]} ({s["dfe"]}), {s["postcode"]}')
    schools.append(s)

print('  not in the guide:', unmatched)
out = {'schools': sorted(schools, key=lambda s: s['name']), 'catch': [],
       'sources': [{'year': y, 'url': DFE_SRC} for y in YEARS], 'updated': datetime.date.today().isoformat()}
json.dump(out, open(OUT, 'w'), separators=(',', ':'))
print(f'{len(schools)} schools, {sum(1 for s in schools if any("n" in x for x in s["d"]))} with a note from the guide, '
      f'{len(json.dumps(out, separators=(",", ":"))) // 1024} KB')
