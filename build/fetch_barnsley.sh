#!/bin/sh
# Download Barnsley's raw sources into an empty folder, then build:
#   sh build/fetch_barnsley.sh /path/to/barnsley-raw
#   python3 -I build/barnsley_guide.py /path/to/barnsley-raw build/barnsley/allocations.json
#   python3 -I build/build_barnsley.py /path/to/barnsley-raw /path/to/ny-raw build/barnsley.json
# The national files (Ofsted, DfE applications and offers) come from build/fetch.sh's folder; build/barnsley/wards.json
# holds each school postcode's ward, from postcodes.io.
# Each autumn, the council's new guide for parents carries the year's places: add it below (keep the old ones, as the
# council takes them down), to GUIDES in barnsley_guide.py and to GUIDE in build_barnsley.py.
set -eu
RAW=$1
mkdir -p "$RAW"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36"

# The national register of schools: locations, type, faith, website (Get Information About Schools, daily)
curl -fsSL -o "$RAW/gias.csv" "https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata$(date +%Y%m%d).csv"; echo "  gias.csv"

# Who got in: "A guide for parents with children starting Primary School" in 2027, 2026 and 2025 (the year before's places).
# The 2025 guide is no longer on the council's site; this is the Internet Archive's copy of April 2025.
B=https://www.barnsley.gov.uk/media
curl -fsSL -A "$UA" -o "$RAW/guide27.pdf" "$B/sydlk4be/pimary-school-admission-booklet-2027.pdf"; echo "  guide27.pdf"
curl -fsSL -A "$UA" -o "$RAW/guide26.pdf" "$B/locjtvek/primary-school-admissions-2026-booklet.pdf"; echo "  guide26.pdf"
curl -fsSL -o "$RAW/guide25.pdf" "https://web.archive.org/web/20250405215724id_/https://www.barnsley.gov.uk/media/024n1s3g/bmbc-primary-admissions-booklet_web_1.pdf"; echo "  guide25.pdf"
