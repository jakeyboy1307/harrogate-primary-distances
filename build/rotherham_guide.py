"""Read Rotherham Council's primary application booklet into build/rotherham/allocations.json.

Usage:  python3 -I build/rotherham_guide.py <booklet.pdf> build/rotherham/allocations.json

The booklet (for September 2027, from build/fetch_rotherham.sh) has two things the build uses. Needs pdftotext.
- Section 4's table of schools: each school's name (in capitals), address with postcode, number on roll and admission
  number, read here by postcode.
- "Further Information on the 2026/27 Primary School Allocations": every school that was full at allocation, grouped by
  the rule its last places went by. For most, the places left after the higher categories went by distance: how many
  places were left, how many children applied in that category, and how many of them missed out. For one, the last
  places went to children in the catchment. For voluntary aided schools, only the applications and how many missed out.
"""
import json, re, subprocess, sys

PDF, OUT = sys.argv[1], sys.argv[2]
YEAR = 2026
text = subprocess.run(['pdftotext', '-layout', PDF, '-'], capture_output=True, text=True, check=True).stdout
lines = text.splitlines()

# ---------- section 4: admission numbers ----------
PC = re.compile(r'\b([A-Z]{1,2}\d{1,2}[A-Z]?)\s+(\d[A-Z]{2})\b')
NUMS = re.compile(r'\s{3,}(\d+)\s+(\d+)\s+(?:-|\d+)\s+(?:-|\d+)\s')   # on roll, admission number, nursery AM and PM
start = next(i for i, l in enumerate(lines) if l.strip().startswith('SECTION 4 - INFORMATION ON ALL SCHOOLS'))
end = next(i for i, l in enumerate(lines) if l.startswith('Further Information on the 2026/27'))
# each school is a block: its name in capitals, then its address, phone, email and website; the numbers sit on
# whichever address line the layout put them, as does the postcode
blocks, cur = [], None
for l in lines[start:end]:
    # "SWINTON QUEEN PRIMARY          White Woods": the trust's name can start on the school's line
    m = re.fullmatch(r"([A-Z][A-Z .,&’'()/-]+?)(?:\s{3,}\S.*)?", l.strip())
    if m and len(m.group(1)) > 4 and not m.group(1).startswith(('SECTION', 'A ', 'B ')):
        cur = {'name': m.group(1), 'lines': []}
        blocks.append(cur)
    elif cur is not None:
        cur['lines'].append(l)
schools = []
for b in blocks:
    pc = next((m for l in b['lines'] if (m := PC.search(l))), None)
    nums = next((m for l in b['lines'] if (m := NUMS.search(l + ' '))), None)
    if pc and nums:
        schools.append({'name': b['name'], 'postcode': pc.group(1) + pc.group(2), 'roll': int(nums.group(1)), 'pan': int(nums.group(2))})
    elif pc or nums:
        print(f'  {b["name"]}: {"no numbers" if pc else "no postcode"}')

# ---------- the year's full schools ----------
end2 = next(i for i, l in enumerate(lines) if l.startswith('SECTION 5 - THE ADMISSION CRITERIA'))
full, kind = [], None
for l in lines[end:end2]:
    s = l.strip()
    if 'lived nearest' in s or 'who lived nearest' in s:
        kind = 'dist'
    elif s.startswith('catchment area of the school'):   # "… from category 5 who lived in the / catchment area of the school"
        kind = 'catch'
    elif s.startswith('Oversubscribed Voluntary Aided'):
        kind = 'va'
    m = re.match(r'^([A-Z][A-Za-z’\'. &]+?)\s{2,}(\d+)\s+(\d+)(?:\s+(\d+))?$', s)
    if m and kind:
        nums = [int(x) for x in m.groups()[1:] if x is not None]
        row = {'name': re.sub(r'([a-z])([A-Z])', r'\1 \2', m.group(1)).strip(), 'kind': kind}   # "WaverleyJunior Academy"
        if kind == 'va':
            row.update(apps=nums[0], refused=nums[1])
        else:
            row.update(left=nums[0], apps=nums[1], refused=nums[2])
        full.append(row)
        continue
    # "There were also 3 children from category 6 (sibling) who were refused …": the last school's other refusals
    m = re.match(r'There were also (\d+) children from category \d+ \((\w+)\)', s)
    if m and full:
        full[-1].setdefault('also', {})[m.group(2)] = int(m.group(1))

json.dump({'year': YEAR, 'schools': schools, 'full': full}, open(OUT, 'w'), indent=1, ensure_ascii=False)
print(f'{len(schools)} schools in the table, {len(full)} full in {YEAR}: '
      f'{sum(r["kind"] == "dist" for r in full)} by distance, {sum(r["kind"] == "catch" for r in full)} by catchment, {sum(r["kind"] == "va" for r in full)} voluntary aided')
