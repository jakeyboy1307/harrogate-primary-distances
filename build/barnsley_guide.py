"""Read Barnsley Council's primary admissions guides into build/barnsley/allocations.json.

Usage:  python3 -I build/barnsley_guide.py <raw-dir> build/barnsley/allocations.json

<raw-dir> holds guide25.pdf, guide26.pdf and guide27.pdf ("A guide for parents with children starting Primary School"
in 2025, 2026 and 2027, from build/fetch_barnsley.sh), with 2024's, 2025's and 2026's places. Needs pdftotext.

Each guide has two lists for the year before:
- "Oversubscribed schools": every primary school that had more applications than places, and the distance in miles of
  the last place offered;
- Appendix 1, "Breakdown of how places were allocated": for every school, its number of places and the places offered
  by rule (EHCP, looked after children, sibling, distance; church schools' own rules, such as "resident within the
  ecclesiastical parish of Tankersley"), and the total.
"""
import json, re, subprocess, sys

RAW, OUT = sys.argv[1], sys.argv[2]
GUIDES = {2024: 'guide25.pdf', 2025: 'guide26.pdf', 2026: 'guide27.pdf'}
LABEL = re.compile(r'^\s*(\S.*?)\s{2,}(\d+)\s*$')
JUNK = re.compile(r'Apply online|A guide for parents|^\s*\d+\s*$|Appendix|Breakdown of how|allocated for academic|^\s*\d{4}-\d{2}\s*$')
KEYS = {'Number of places': 'places', 'Education, Health and Care Plan (EHCP)': 'ehcp', 'Looked after children': 'lac',
        'Sibling': 'sib', 'Distance': 'dist', 'Total places offered': 'total'}

data = {}
for y, f in GUIDES.items():
    text = subprocess.run(['pdftotext', '-layout', f'{RAW}/{f}', '-'], capture_output=True, text=True, check=True).stdout
    lines = text.splitlines()
    # the oversubscribed schools: "Birkwood Primary School      2.834" (tabs in some names)
    start = next(i for i, l in enumerate(lines) if l.strip() == 'Oversubscribed schools')
    over = {}
    for l in lines[start:start + 80]:
        m = re.match(r'^\s*([A-Z][^\d]*?)\s{2,}(\d+(?:\.\d+)?)\s*(?:\(\w+\))?\s*$', l.replace('\t', '  '))   # "4.673 (Faith)"
        if m and 'Apply online' not in l:
            over[re.sub(r'[\x00-\x1f]', '', m.group(1)).strip()] = float(m.group(2))   # some names end in a stray control character
        if 'How to apply' in l:
            break
    # the appendix: a school's name (one or more lines), then its rules, one a line
    start = max(i for i, l in enumerate(lines) if 'Breakdown of how places were' in l)
    schools, cur, names = [], None, []
    for l in lines[start + 1:]:
        if not l.strip():
            names = []   # a blank line ends a run of name lines
            continue
        if JUNK.search(l):
            continue
        m = LABEL.match(l)
        if m and m.group(1).strip().rstrip('*') == 'Number of places':
            name = ' '.join(names).strip()
            # "Holy Rood Catholic Primary School*": the star marks a school that sets its own rules
            cur = {'name': name.rstrip('*').strip(), 'own': name.endswith('*'), 'rules': {}}
            schools.append(cur)
            names = []
        if m and cur is not None:
            label = m.group(1).strip().rstrip('*')
            if label in KEYS:
                cur[KEYS[label]] = int(m.group(2))
            else:
                cur['rules'][label] = int(m.group(2))   # a school's own rule: faith, parish, medical or social need
            continue
        names.append(l.strip())
    data[y] = {'schools': schools, 'over': over}   # the build matches each list to the register: they spell some names differently
    print(f'{y}: {len(schools)} schools in the appendix, {sum(1 for s in schools if s["rules"])} with their own rules, {len(over)} oversubscribed')
json.dump(data, open(OUT, 'w'), indent=1)
