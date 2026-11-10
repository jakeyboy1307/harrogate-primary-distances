"""Read Leeds City Council's primary catchment maps (GeoPDFs) into build/leeds/catchments.geojson.

Usage:  python3 -I build/leeds_maps.py <raw-dir> build/leeds/catchments.geojson

<raw-dir> holds maps-1.pdf and maps-2.pdf ("2026 primary school catchment maps", parts 1 and 2) and leeds-2026.csv
(Data Mill North's allocations, for each school's number and location). Needs PyMuPDF, shapely and pyproj.

Each page is one school's map, exported from ArcMap as a GeoPDF: the page's map frame carries its four corners as
latitude and longitude (on the OSGB36 datum the map is drawn in) and the catchment boundary is a vector path on its
own "Catchment Area" layer. So each boundary's points are placed exactly: page position -> British National Grid
by the frame's corners -> latitude and longitude. Each school's own location is checked to sit inside its catchment.
"""
import csv, json, re, sys
import fitz
import numpy as np
from pyproj import Transformer
from shapely.geometry import LineString, Point, mapping
from shapely.ops import polygonize, transform, unary_union

RAW, OUT = sys.argv[1], sys.argv[2]
to_bng = Transformer.from_crs(4277, 27700, always_xy=True).transform   # OSGB36 latitude and longitude -> National Grid
to_ll = Transformer.from_crs(27700, 4326, always_xy=True).transform

rows = list(csv.reader(open(f'{RAW}/leeds-2026.csv', encoding='utf-8-sig', errors='replace')))
head = [h.strip() for h in rows[1]]
schools = [dict(zip(head, [x.strip() for x in r])) for r in rows[2:] if r and r[0].strip().isdigit()]
DROP = r"\b(primary|school|academy|and|nursery|church of england|c of e|ce|cofe|voluntary|controlled|aided|vc|va|the|st|saint|community)\b"
key = lambda n: re.sub(r'[^a-z]', '', re.sub(DROP, ' ', n.lower().replace('&', ' and ').replace('’', "'")))
by_key = {}
for s in schools:
    by_key.setdefault(key(s['School']), []).append(s)
# a map's title where it doesn't come down to the council's name for the school
NAME_FIX = {'Westroyd Primary and Nursery School': 'Farsley Westroyd Primary School', 'Lowtown Primary School': 'Pudsey Lowtown Primary School',
            'Roundhay School (Primary Campus)': 'Roundhay School (Primary Site)',
            "St James' Church of England Voluntary Controlled Primary School": "Wetherby St James' Church of England Voluntary Controlled Primary School"}


def frame(doc, page):
    """The page's affine map from PDF points (origin bottom left) to National Grid metres."""
    vp = doc.xref_get_key(page.xref, 'VP')[1]
    bbox = [float(v) for v in re.search(r'/BBox\s*\[([^\]]+)\]', vp).group(1).split()]
    meas = int(re.search(r'/Measure (\d+) 0 R', vp).group(1))
    m = doc.xref_object(meas)
    nums = lambda k: [float(v) for v in re.search(rf'/{k}\s*\[([^\]]+)\]', m).group(1).split()]
    gpts, lpts = nums('GPTS'), nums('LPTS')
    x1, y1, x2, y2 = bbox
    src, dst = [], []
    for i in range(0, len(gpts), 2):
        lat, lon = gpts[i], gpts[i + 1]
        u, v = lpts[i], lpts[i + 1]
        src.append([x1 + u * (x2 - x1), y1 + v * (y2 - y1), 1])
        dst.append(to_bng(lon, lat))
    a, *_ = np.linalg.lstsq(np.array(src), np.array(dst), rcond=None)
    return lambda x, y: tuple(np.array([x, y, 1]) @ a)


features, bad = [], []
for part in (1, 2):
    doc = fitz.open(f'{RAW}/maps-{part}.pdf')
    for page in doc:
        title = re.search(r'(.+?) Catchment Area', page.get_text()).group(1).strip()
        title = re.sub(r'\s+', ' ', title)
        f = frame(doc, page)
        h = page.rect.height
        lines = []
        for d in page.get_drawings():
            if d.get('layer') != 'Catchment Area':
                continue
            for it in d['items']:
                if it[0] == 'l':
                    lines.append(LineString([f(it[1].x, h - it[1].y), f(it[2].x, h - it[2].y)]))
                elif it[0] == 'c':   # a curve: its end points are enough at this scale
                    lines.append(LineString([f(it[1].x, h - it[1].y), f(it[4].x, h - it[4].y)]))
                elif it[0] == 're':
                    r = it[1]
                    pts = [(r.x0, r.y0), (r.x1, r.y0), (r.x1, r.y1), (r.x0, r.y1), (r.x0, r.y0)]
                    lines.append(LineString([f(x, h - y) for x, y in pts]))
        polys = list(polygonize(unary_union(lines)))
        if not polys:
            bad.append(f'{title}: no boundary found')
            continue
        # polygonize also returns the holes between rings; keep the outline (the union of every face)
        shape = unary_union(polys).buffer(0).simplify(4, preserve_topology=True)
        hits = by_key.get(key(NAME_FIX.get(title, title)), [])
        if len(hits) != 1:
            bad.append(f'{title}: {len(hits)} schools match')
            continue
        s = hits[0]
        if s['X_REF'] and not shape.buffer(150).contains(Point(float(s['X_REF']), float(s['Y_REF']))):
            bad.append(f'{title}: the school is {shape.distance(Point(float(s["X_REF"]), float(s["Y_REF"]))):.0f} m outside its catchment')
        features.append({'type': 'Feature', 'properties': {'dfe': int(s['School Code']), 'name': title},
                         'geometry': mapping(transform(to_ll, shape))})

print(f'{len(features)} catchments; to look at: {bad}')
json.dump({'type': 'FeatureCollection', 'features': features}, open(OUT, 'w'))
