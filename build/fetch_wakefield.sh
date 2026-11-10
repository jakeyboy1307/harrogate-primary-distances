#!/bin/sh
# Download Wakefield's raw sources into an empty folder, then build:
#   sh build/fetch_wakefield.sh /path/to/wakefield-raw
#   python3 -I build/wakefield_guide.py /path/to/wakefield-raw/guide.docx build/wakefield/allocations.json   (macOS: uses textutil)
#   python3 -I build/build_wakefield.py /path/to/wakefield-raw /path/to/ny-raw build/wakefield.json
# The national files (Ofsted, DfE applications and offers) come from build/fetch.sh's folder; build/wakefield/wards.json
# holds each school postcode's ward, from postcodes.io.
# Each autumn, the council's new Primary Guide for Parents carries the year's places by category: replace the link
# below and GUIDE_SRC in build_wakefield.py. The council publishes no cut-off distances and no catchment maps with
# full detail (only an address search behind a reCAPTCHA), so neither is downloaded.
set -eu
RAW=$1
mkdir -p "$RAW"
UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130 Safari/537.36"

# The national register of schools: locations, type, faith, website (Get Information About Schools, daily)
curl -fsSL -o "$RAW/gias.csv" "https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata$(date +%Y%m%d).csv"; echo "  gias.csv"

# The Primary Guide for Parents (for September 2027, with September 2026's places by category)
curl -fsSL -A "$UA" -o "$RAW/guide.docx" "https://www.wakefield.gov.uk/media/43xpw5x4/primaryguide-27-28.docx"; echo "  guide.docx"
