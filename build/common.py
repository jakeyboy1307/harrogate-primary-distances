"""Pieces shared by the council builds (build_data.py for North Yorkshire, build_york.py for York, and the Humber's):
Ofsted outcomes, school types and the DfE's applications and offers."""
import csv, io, re

ROW = {'1': 'Outstanding', '2': 'Good', '3': 'Requires improvement', '4': 'Inadequate'}
CONCERN = {'SM': 'Special measures', 'SWK': 'Serious weaknesses'}
val = lambda v: None if v in ('', 'NULL', None) else v
iso = lambda d: None if not val(d) else f'{d[6:10]}-{d[3:5]}-{d[0:2]}'


def read_mi(path):
    """Ofsted management information, by LAESTAB (the council's number plus the school's code)."""
    rows = list(csv.reader(io.StringIO(open(path, 'rb').read().decode('utf-8-sig', errors='replace'))))
    h = next(i for i, r in enumerate(rows[:10]) if 'URN' in r)
    return {r[2]: dict(zip(rows[h], r)) for r in rows[h + 1:] if len(r) > 2}


def ofsted(x, mi19):
    """A school's latest Ofsted outcome. mi19 is the August 2019 file: a school whose last graded inspection came
    before September 2019 has no grade in the current file, only short-inspection outcomes such as "Standards
    maintained", and the 2019 file still has that grade."""
    if not x:
        return None
    o = {'urn': x['URN'], 'link': f"https://reports.ofsted.gov.uk/provider/21/{x['URN']}"}
    if val(x['Inspection type']):   # report card (from November 2025)
        names = ['Inclusion', 'Curriculum and teaching', 'Achievement', 'Attendance and behaviour',
                 'Personal development and wellbeing', 'Early years (where applicable)', 'Leadership and governance']
        o.update(kind='card', date=iso(x['Inspection start date']),
                 areas=[[n.replace(' (where applicable)', ''), x[n]] for n in names if val(x[n]) and x[n] != 'Not applicable'],
                 safeguarding=val(x['Safeguarding standards']))
        rel = x['Does the latest full inspection relate to the URN of the current school?']
        concern = val(x['Category of concern'])
    elif val(x['Latest OEIF overall effectiveness']):
        oe = x['Latest OEIF overall effectiveness']
        o['date'] = iso(x['Inspection start date of latest OEIF graded inspection'])
        if oe in ROW:
            o.update(kind='grade', grade=ROW[oe])
        else:   # September 2024 to November 2025: sub-grades only
            names = [('Quality of education', 'Latest OEIF quality of education'),
                     ('Behaviour and attitudes', 'Latest OEIF behaviour and attitudes'),
                     ('Personal development', 'Latest OEIF personal development'),
                     ('Leadership and management', 'Latest OEIF effectiveness of leadership and management'),
                     ('Early years', 'Latest OEIF early years provision (where applicable)')]
            o.update(kind='areas', areas=[[n, ROW[x[k]]] for n, k in names if x[k] in ROW])
        rel = x['Does the latest OEIF graded inspection relate to the URN of the current school?']
        concern = val(x['Latest OEIF category of concern'])
    elif val(x['Ungraded inspection overall outcome']):
        o['kind'] = 'ungraded'
        rel = x['Does the ungraded inspection relate to the URN of the current school?']
        concern = None
        old = mi19.get(x['LAESTAB'])
        if old and old.get('Overall effectiveness') in ROW:
            o['graded'] = {'grade': ROW[old['Overall effectiveness']], 'date': iso(old['Inspection start date'])}
    else:
        o['kind'] = 'none'
        return o
    if val(x['Ungraded inspection overall outcome']):
        ud = iso(x['Date of latest ungraded inspection'])
        if o['kind'] == 'ungraded' or ud > (o.get('date') or ''):
            outcome = re.sub(r'\s*-\s*S5 Next$', '', x['Ungraded inspection overall outcome'])
            o['ungraded'] = {'date': ud, 'outcome': outcome}
            if o['kind'] == 'ungraded':
                o['date'] = ud
    if rel == 'No':
        o['predecessor'] = True
    if concern in CONCERN:
        o['concern'] = CONCERN[concern]
    return o


# The council sheets' school types; schools that aren't community or voluntary controlled set their own admission rules
TYPES = {'Community School': 'community', 'Voluntary Controlled': 'voluntary controlled',
         'Voluntary Aided': 'voluntary aided', 'Academy': 'academy', 'Foundation': 'foundation',
         'Free School': 'free school'}
OWN_RULES = lambda k: k not in ('Community School', 'Voluntary Controlled')


def kind(k, faith):
    f = {'Church of England': 'C of E', 'Roman Catholic': 'Catholic'}.get(faith or '')
    return f'{f} {TYPES[k]}' if f else TYPES[k]


# ---------- DfE applications and offers (build/fetch.sh: dfe-offers.csv) ----------
DFE_SRC = 'https://explore-education-statistics.service.gov.uk/find-statistics/primary-and-secondary-school-applications-and-offers'
num0 = lambda v: int(v) if str(v).strip().isdigit() else None


def read_dfe(path, councils):
    """Reception entry figures for the named councils' primary schools, by URN then year (2026 for September 2026):
    a = times put as any preference, f = times put first, fo = first choices offered, o = places offered.
    Also each school's latest parliamentary constituency, under 'con'."""
    out = {}
    for r in csv.DictReader(open(path, encoding='utf-8-sig')):
        if r['la_name'] not in councils or r['school_phase'] != 'Primary' or r['entry_year'] != 'R':
            continue
        urn, y = r['school_urn'], int(r['time_period'][:4])
        rec = {'a': num0(r['times_put_as_any_preferred_school']), 'f': num0(r['times_put_as_1st_preference']),
               'fo': num0(r['number_1st_preference_offers']), 'o': num0(r['total_number_places_offered'])}
        s = out.setdefault(urn, {'years': {}})
        s['years'][y] = rec
        con = r['ParliamentaryConstituency_name']
        if con not in ('', 'z') and y >= s.get('con_y', 0):
            s['con'], s['con_y'] = con, y
    return out


def firsts_year(y, rec, places=None):
    """A year with only the DfE's figures: everyone who put the school first got it, or only some did."""
    r = {'y': y, 's': 'firsts', 'a': rec['a'], 'f': rec['f'], 'fo': rec['fo'], 'o': rec['o']}
    if places:
        r['p'] = places
    return r


# ---------- the national register of schools (Get Information About Schools: fetch_eastriding.sh's gias.csv) ----------
GIAS_TYPES = {'Community school': 'Community School', 'Voluntary controlled school': 'Voluntary Controlled',
              'Voluntary aided school': 'Voluntary Aided', 'Foundation school': 'Foundation', 'Academy converter': 'Academy',
              'Academy sponsor led': 'Academy', 'Free schools': 'Free School'}


def register_schools(path, la, urns):
    """A council's open primary schools in the register that are among `urns` (those with a Reception intake in the
    DfE's figures): number, name, type, faith, location (latitude and longitude), postcode, address and website."""
    from pyproj import Transformer
    to_ll = Transformer.from_crs(27700, 4326, always_xy=True)
    out = []
    for r in csv.DictReader(open(path, encoding='cp1252')):
        if r['LA (code)'] != la or not r['EstablishmentStatus (name)'].startswith('Open') or r['URN'] not in urns:
            continue
        if r['PhaseOfEducation (name)'] not in ('Primary', 'All-through'):
            continue
        lng, lat = to_ll.transform(float(r['Easting']), float(r['Northing']))
        web = r['SchoolWebsite'].strip()
        out.append({'urn': r['URN'], 'code': int(r['EstablishmentNumber']), 'name': r['EstablishmentName'],
                    'kind': GIAS_TYPES[r['TypeOfEstablishment (name)']], 'faith': r['ReligiousCharacter (name)'],
                    'll': [round(lat, 6), round(lng, 6)], 'postcode': r['Postcode'], 'locality': r['Locality'], 'town': r['Town'],
                    'addr': ', '.join(x for x in (r['Street'], r['Locality'], r['Town'], r['Postcode']) if x),
                    'web': (web if web.startswith('http') else 'https://' + web) if web else None})
    return out


def successors(path, la, taking):
    """Schools that became academies after the DfE's latest figures: the register has them under a new URN with the same
    school number as the closed one the figures are under. Returns {new URN: the closed school's register row}."""
    rows = [r for r in csv.DictReader(open(path, encoding='cp1252')) if r['LA (code)'] == la]
    closed = {r['EstablishmentNumber']: r for r in rows if r['URN'] in taking and not r['EstablishmentStatus (name)'].startswith('Open')}
    return {r['URN']: closed[r['EstablishmentNumber']] for r in rows
            if r['EstablishmentStatus (name)'].startswith('Open') and r['EstablishmentNumber'] in closed and r['URN'] not in taking}
