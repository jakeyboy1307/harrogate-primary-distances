#!/bin/sh
# Download Doncaster's raw sources into an empty folder, then build:
#   sh build/fetch_doncaster.sh /path/to/doncaster-raw
#   python3 -I build/build_doncaster.py /path/to/doncaster-raw /path/to/ny-raw build/doncaster.json
# The national files (Ofsted, DfE applications and offers) come from build/fetch.sh's folder; build/doncaster/wards.json
# holds each school postcode's ward, from postcodes.io. The council publishes no cut-off distances, so who got in is the
# DfE's figures alone.
set -eu
RAW=$1
mkdir -p "$RAW"

# The national register of schools: locations, type, faith, website (Get Information About Schools, daily)
curl -fsSL -o "$RAW/gias.csv" "https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata$(date +%Y%m%d).csv"; echo "  gias.csv"

# The primary catchments: the layer behind the council's catchment finder (each with its school's DfE number; shared
# "option areas" name two or three schools). The infant layer repeats the infant schools' areas, so isn't needed.
curl -fsSL -o "$RAW/catchments.geojson" "https://maps.doncaster.gov.uk/server/rest/services/Schools/School_Admissions/FeatureServer/5/query?where=1%3D1&outFields=*&outSR=4326&f=geojson"; echo "  catchments.geojson"
