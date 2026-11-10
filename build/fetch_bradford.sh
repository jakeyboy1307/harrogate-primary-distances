#!/bin/sh
# Download Bradford's raw sources into an empty folder, then build:
#   sh build/fetch_bradford.sh /path/to/bradford-raw
#   python3 -I build/bradford_guide.py /path/to/bradford-raw build/bradford/allocations.json
#   python3 -I build/bradford_maps.py /path/to/bradford-raw/pa build/bradford/priority-areas.geojson    (needs PyMuPDF)
#   python3 -I build/build_bradford.py /path/to/bradford-raw /path/to/ny-raw build/bradford.json
# The national files (Ofsted, DfE applications and offers) come from build/fetch.sh's folder.
# Each autumn, the council's new primary guide carries the year's allocations: add it below, to GUIDES in
# bradford_guide.py, and point GUIDE_SRC in build_bradford.py at it. The council takes older guides down.
set -eu
RAW=$1
mkdir -p "$RAW/pa"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36"

# The national register of schools: locations, type, faith, website (Get Information About Schools, daily)
curl -fsSL -o "$RAW/gias.csv" "https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata$(date +%Y%m%d).csv"; echo "  gias.csv"

# Who got in: the primary guides' "List of primary schools" (September 2027's has 2026's figures, September 2024's 2023's)
B=https://www.bradford.gov.uk/media
curl -fsSL -A "$UA" -o "$RAW/guide27.pdf" "$B/dy1lr1hm/applying-for-a-primary-school-detailed-guide-for-september-2027.pdf"; echo "  guide27.pdf"
curl -fsSL -A "$UA" -o "$RAW/guide24.pdf" "$B/6636/applying-for-primary-school-detailed-guide-for-september-2024-entry.pdf"; echo "  guide24.pdf"

# The priority area maps, one GeoPDF a school (https://bso.bradford.gov.uk/content/admissions/priority-areas)
P="https://bso.bradford.gov.uk/userfiles/file/Learning%20Services"
for n in "PriPrA Addingham" "PriPrA Baildon CofE" "PriPrA Ben Rhydding" "PriPrA Cottingley Village 1 and 2" \
         "PriPrA East Morton CofE" "PriPrA Eldwick 1 and 2" "PPrA Long Lee Priority Area New 2023" "PriPrA Myrtle Park" \
         "PriPrA Oxenhope CofE Parish Boundary" "PriPrA Sandal" "PriPrA Silsden" "PriPrA St Josephs Bingley Defined Area" \
         "PriPrA Victoria"; do
  curl -fsSL -A "$UA" -o "$RAW/pa/$n.pdf" "$P/$(echo "$n" | sed 's/ /%20/g').pdf"; echo "  pa/$n.pdf"
done
