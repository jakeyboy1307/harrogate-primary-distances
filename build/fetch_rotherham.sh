#!/bin/sh
# Download Rotherham's raw sources into an empty folder, then build:
#   sh build/fetch_rotherham.sh /path/to/rotherham-raw
#   python3 -I build/rotherham_guide.py /path/to/rotherham-raw/booklet.pdf build/rotherham/allocations.json
#   python3 -I build/build_rotherham.py /path/to/rotherham-raw /path/to/ny-raw build/rotherham.json
# The national files (Ofsted, DfE applications and offers) come from build/fetch.sh's folder; build/rotherham/wards.json
# holds each school postcode's ward, from postcodes.io.
# Each autumn, the council's new primary application booklet carries the year's oversubscribed schools: replace the
# link below and BOOKLET in build_rotherham.py. The council's catchments are drawn only on its web map (as pictures, not
# data), so none are downloaded.
set -eu
RAW=$1
mkdir -p "$RAW"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36"

# The national register of schools: locations, type, faith, website (Get Information About Schools, daily)
curl -fsSL -o "$RAW/gias.csv" "https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata$(date +%Y%m%d).csv"; echo "  gias.csv"

# The primary application booklet (for September 2027: admission numbers, and how 2026's places went at full schools)
curl -fsSL -A "$UA" -o "$RAW/booklet.pdf" "https://www.rotherham.gov.uk/downloads/file/5088/primary-application-booklet-pdf-"; echo "  booklet.pdf"
