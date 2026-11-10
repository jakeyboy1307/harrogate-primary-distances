"""Read Sheffield City Council's "Entrance into Reception: oversubscribed schools" PDFs into build/sheffield/allocations.json.

Usage:  python3 -I build/sheffield_tables.py <raw-dir> build/sheffield/allocations.json

<raw-dir> holds over-2024.pdf, over-2025.pdf and over-2026.pdf (build/fetch_sheffield.sh). Needs pdftotext.

Each PDF lists the community schools (and academies on the council's rules) that had more applicants than places, one
row each: places, then the places offered by rule (LAC, SEN, catchment with an older brother or sister, catchment,
brother or sister, other), the total, the distance of the last child offered a place (miles, straight line) and the
applicants refused by rule (catchment, brother or sister, other, total). A name too long for its cell carries on to
the next line ("Bradfield" / "Dungworth"). Below the table, the Catholic and Church of England schools that were also
oversubscribed are named, without figures: they're kept as "church" so the build can tell them apart.
"""
import json, re, subprocess, sys

RAW, OUT = sys.argv[1], sys.argv[2]
YEARS = (2024, 2025, 2026)
NUM = r'\d+(?:\.\d+)?\*{0,2}'
ROW = re.compile(rf'^\s*([A-Za-z][A-Za-z .\'’&-]*?)\s+((?:{NUM}\s+){{10,12}}{NUM})\s*$')
# Misprints in the PDFs, checked against each row's other figures: (year, name) -> the corrected fields
FIX = {(2026, 'Hunters Bar Infant'): {'other': 14},   # printed 114; 1 + 0 + 19 + 39 + 17 + 14 = its 90 places
       (2026, 'Mosborough'): {'total': 60}}            # printed 30; its places by rule add up to 60, its admission number
FIELDS = ('places', 'lac', 'sen', 'cm_sib', 'cm', 'sib', 'other', 'total', 'dist', 'ref_cm', 'ref_sib', 'ref_other', 'ref_total')

data = {}
for y in YEARS:
    text = subprocess.run(['pdftotext', '-layout', f'{RAW}/over-{y}.pdf', '-'], capture_output=True, text=True, check=True).stdout
    rows, last, church, tail = [], None, [], False
    for line in text.splitlines():
        if re.search(r'following (Catholic|Church of England|Foundation) School', line):
            tail = True
            continue
        if 'Reasons for Refusal' in line:   # the 2026 PDF goes on to list refusals by legal ground: not needed
            break
        if tail:   # the schools named under the table: "St Catherines, St Maries, ..." or "Parson Cross"
            if line.strip() and not re.search(r'operate different|contact the schools|^\s*\d+\s*$|determined admissions', line):
                church += [n.strip(' ;.') for n in line.split(',') if n.strip(' ;.')]
            continue
        m = ROW.match(line)
        if m:
            nums = m.group(2).split()
            if len(nums) == 12:   # a blank cell: Wybourn's SEN in 2025, whose other places add up to its total without it
                nums.insert(2, '0')
            if len(nums) != 13:
                print(f'  {y}: skipped {line.strip()!r}')
                continue
            r = {'name': m.group(1).strip()}
            for k, v in zip(FIELDS, nums):
                r[k] = float(v.rstrip('*')) if k == 'dist' else int(v.rstrip('*'))
            rows.append(r)
            last = r
            continue
        word = line.strip()
        # a wrapped name's second line, straight after its row
        if last is not None and re.fullmatch(r'[A-Z][a-z]+', word):
            last['name'] += ' ' + word
            continue
        last = None
    for r in rows:   # once wrapped names are whole
        r.update(FIX.get((y, r['name']), {}))
        given = sum(r[k] for k in ('lac', 'sen', 'cm_sib', 'cm', 'sib', 'other'))
        if given != r['total']:
            r['check'] = f'places by rule add up to {given}, not {r["total"]}'
    data[y] = {'schools': rows, 'church': church}
    print(f'{y}: {len(rows)} schools, {sum(1 for r in rows if "check" in r)} that don\'t add up; also oversubscribed: {church}')
json.dump(data, open(OUT, 'w'), indent=1)
