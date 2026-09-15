#!/bin/sh
set -eu

storage_root="${Storage__RootPath:-/data/media}"
mkdir -p "$storage_root"

# Refresh bundled demo media on every deployment so fixed seed files replace
# stale copies on the persistent volume. Files uploaded by users have random
# GUID names and are not present in /app/seed-media, so they are left intact.
if [ -d /app/seed-media ]; then
  cp -rf /app/seed-media/. "$storage_root"/
fi

port="${PORT:-8080}"
exec dotnet YouTubeClone.Api.dll --urls "http://0.0.0.0:${port}"
