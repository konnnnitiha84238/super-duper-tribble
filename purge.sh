#!/usr/bin/env bash
# Usage: ./tools/purge.sh https://origin.example.com/path -H "x-purge-token: TOKEN"
if [ -z "$1" ]; then
  echo "Usage: $0 <url> [token]"
  exit 1
fi
URL=$1
TOKEN=${2:-$PURGE_TOKEN}
curl -X POST -H "Content-Type: application/json" -H "x-purge-token: $TOKEN" -d "{"url": "${URL}"}" http://localhost:8000/_purge
