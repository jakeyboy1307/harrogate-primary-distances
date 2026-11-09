#!/bin/sh
# Download East Riding of Yorkshire's raw sources into an empty folder, then build:
#   sh build/fetch_eastriding.sh /path/to/er-raw
#   python3 -I build/build_eastriding.py /path/to/er-raw /path/to/ny-raw build/east-riding.json
# The national files (Ofsted, DfE applications and offers) come from build/fetch.sh's folder.
# Each spring, add the new year's allocation summary to build/east-riding/allocations.csv (the council's "Summary of
# primary school allocations", under School admissions documents) and the new admission numbers below.
set -eu
RAW=$1
mkdir -p "$RAW"

# The national register of schools: locations, type, faith, website (Get Information About Schools, daily)
curl -fsSL -o "$RAW/gias.csv" "https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata$(date +%Y%m%d).csv"; echo "  gias.csv"

# Primary catchment areas: the layer behind the council's catchment finder
curl -fsS -G "https://services6.arcgis.com/Qptn479QktK11k72/arcgis/rest/services/School_Boundaries_23_Update/FeatureServer/0/query" \
  --data-urlencode "where=1=1" --data-urlencode "outFields=*" --data-urlencode "outSR=4326" \
  --data-urlencode "geometryPrecision=6" --data-urlencode "f=geojson" -o "$RAW/catch.geojson"; echo "  catch.geojson"

# Admission numbers for community and voluntary controlled schools, for the year being applied for
curl -fsSL -A "Mozilla/5.0" -o "$RAW/admission_numbers.pdf" \
  "https://www.eastriding.gov.uk/files/eryc_directory/asset_directories/school_admissions/f_admission_numbers_2027_28/f_admission_numbers.pdf"; echo "  admission_numbers.pdf"
