"""Read Bradford Council's primary priority area maps (GeoPDFs) into build/bradford/priority-areas.geojson.

Usage:  python3 -I build/bradford_maps.py <raw-dir>/pa build/bradford/priority-areas.geojson

The folder holds the council's "PriPrA" maps, one PDF per school (build/fetch_bradford.sh), from
https://bso.bradford.gov.uk/content/admissions/priority-areas. Needs PyMuPDF, shapely and pyproj.

Each map is an ArcMap GeoPDF: the page's map frame carries its corners (here in National Grid metres), and the
priority area is a vector path on its own layer ("AddinghamPA"; two layers, PA1 and PA2, where a school has two
tiers, which are joined here; Oxenhope's is its parish boundary). A map without coordinates (St Joseph's, Bingley,
a picture) is listed so its school can be marked as having an area the checker can't check.
"""
import json, os, re, sys
import fitz
import numpy as np
from pyproj import Transformer
from shapely.geometry import Polygon, mapping
from shapely.ops import transform, unary_union

SRC, OUT = sys.argv[1], sys.argv[2]
to_bng = Transformer.from_crs(4277, 27700, always_xy=True).transform
to_ll = Transformer.from_crs(27700, 4326, always_xy=True).transform
SKIP = {'Other', 'Other 2', '<Default>', 'Wards', '', None}


def frame(doc, page):
    vp = doc.xref_get_key(page.xref, 'VP')[1]
    bbox = [float(v) for v in re.search(r'/BBox\s*\[([^\]]+)\]', vp).group(1).split()]
    m = doc.xref_object(int(re.search(r'/Measure (\d+) 0 R', vp).group(1)))
    nums = lambda k: [float(v) for v in re.search(rf'/{k}\s*\[([^\]]+)\]', m).group(1).split()]
    gpts, lpts = nums('GPTS'), nums('LPTS')
    x1, y1, x2, y2 = bbox
    src = [[x1 + lpts[i] * (x2 - x1), y1 + lpts[i + 1] * (y2 - y1), 1] for i in range(0, len(lpts), 2)]
    # the corners are latitude and longitude on most GeoPDFs, but already National Grid metres (northing, easting) on these
    projected = max(abs(v) for v in gpts) > 1000
    dst = [(gpts[i + 1], gpts[i]) if projected else to_bng(gpts[i + 1], gpts[i]) for i in range(0, len(gpts), 2)]
    a, *_ = np.linalg.lstsq(np.array(src), np.array(dst), rcond=None)
    return lambda x, y: tuple(np.array([x, y, 1]) @ a)


features, pictures = [], []
for name in sorted(os.listdir(SRC)):
    if not name.endswith('.pdf'):
        continue
    school = re.sub(r'^P(ri)?PrA |\.pdf$| Priority Area New 2023| 1 and 2| Parish Boundary| Defined Area', '', name)
    doc = fitz.open(os.path.join(SRC, name))
    page = doc[0]
    if doc.xref_get_key(page.xref, 'VP')[0] == 'null':
        pictures.append(school)
        continue
    f, h = frame(doc, page), page.rect.height
    # each drawing is an outline of joined segments that doesn't quite close: chain them into rings and close them
    rings = []
    for d in page.get_drawings():
        if d.get('layer') in SKIP:
            continue
        ring, last = [], None
        for it in d['items']:
            if it[0] == 'l':
                a, b = it[1], it[2]
            elif it[0] == 'c':
                a, b = it[1], it[4]
            else:
                continue
            if last is None or abs(a.x - last.x) + abs(a.y - last.y) > 0.5:   # a new ring starts
                if len(ring) >= 3:
                    rings.append(ring)
                ring = [f(a.x, h - a.y)]
            ring.append(f(b.x, h - b.y))
            last = b
        if len(ring) >= 3:
            rings.append(ring)
    def poly(r):
        pts = [tuple(map(float, p)) for i, p in enumerate(r) if i == 0 or abs(p[0] - r[i - 1][0]) + abs(p[1] - r[i - 1][1]) > 0.01]
        return Polygon(pts + [pts[0]]).buffer(0) if len(set(pts)) >= 3 else Polygon()
    polys = [poly(r) for r in rings]
    polys = [q for q in polys if q.area > 100]   # at least 10 m square
    if not polys:
        print(f'  {school}: no boundary found')
        continue
    shape = unary_union(polys).buffer(0).simplify(4, preserve_topology=True)
    features.append({'type': 'Feature', 'properties': {'school': school, 'km2': round(shape.area / 1e6, 2)},
                     'geometry': mapping(transform(to_ll, shape))})
    print(f'  {school}: {shape.area / 1e6:.2f} km²')

json.dump({'type': 'FeatureCollection', 'features': features, 'pictures': pictures}, open(OUT, 'w'))
print(f'{len(features)} priority areas; maps without coordinates: {pictures}')
