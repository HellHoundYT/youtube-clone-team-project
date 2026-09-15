#!/bin/sh
set -eu

storage_root="${Storage__RootPath:-/data/media}"
mkdir -p "$storage_root"

if [ -d /app/seed-media ]; then
  cp -rn /app/seed-media/. "$storage_root"/ 2>/dev/null || true
fi

port="${PORT:-8080}"
exec dotnet YouTubeClone.Api.dll --urls "http://0.0.0.0:${port}"
