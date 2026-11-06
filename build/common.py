"""Pieces shared by build_data.py (North Yorkshire) and build_york.py (York): Ofsted outcomes and school types."""
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
         'Voluntary Aided': 'voluntary aided', 'Academy': 'academy', 'Foundation': 'foundation'}
OWN_RULES = lambda k: k not in ('Community School', 'Voluntary Controlled')


def kind(k, faith):
    f = {'Church of England': 'C of E', 'Roman Catholic': 'Catholic'}.get(faith or '')
    return f'{f} {TYPES[k]}' if f else TYPES[k]
