#!/bin/sh
# Four Wins lokal starten: http://localhost:4200
set -e
cd "$(dirname "$0")"
if [ ! -d node_modules ]; then
  pnpm install
fi
pnpm start
