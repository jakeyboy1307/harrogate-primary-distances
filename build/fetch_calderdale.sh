#!/bin/sh
# Download Calderdale's raw sources into an empty folder, then build:
#   sh build/fetch_calderdale.sh /path/to/cald-raw
#   python3 -I build/build_calderdale.py /path/to/cald-raw /path/to/ny-raw build/calderdale.json
# The national files (Ofsted, DfE applications and offers) come from build/fetch.sh's folder.
# Each spring, add the new year's "Primary Preferences-Allocations by School" CSV below (Calderdale DataWorks, dataset
# vq9q6: https://dataworks.calderdale.gov.uk/dataset/vq9q6) and to YEARS in build_calderdale.py.
set -eu
RAW=$1
mkdir -p "$RAW"

# The national register of schools: locations, type, faith, website (Get Information About Schools, daily)
curl -fsSL -o "$RAW/gias.csv" "https://ea-edubase-api-prod.azurewebsites.net/edubase/downloads/public/edubasealldata$(date +%Y%m%d).csv"; echo "  gias.csv"

# Each school's places, preferences and the distance of the furthest child offered a place (when oversubscribed)
D=https://dataworks.calderdale.gov.uk/download/vq9q6
curl -fsSL -o "$RAW/cald-2023.csv" "$D/byb/Primary%20Preferences-Allocations%20by%20School%202023.csv"; echo "  cald-2023.csv"
curl -fsSL -o "$RAW/cald-2024.csv" "$D/c38/Primary%20Preferences-Allocations%20by%20School%202024.csv"; echo "  cald-2024.csv"
curl -fsSL -o "$RAW/cald-2025.csv" "$D/p6t/Primary%20Preferences-Allocations%20by%20School%202025.csv"; echo "  cald-2025.csv"
curl -fsSL -o "$RAW/cald-2026.csv" "$D/t8y/Primary%20Preferences-Allocations%20by%20School%202026.csv"; echo "  cald-2026.csv"
