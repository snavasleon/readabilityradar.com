#!/bin/sh
set -eu

cd "$(dirname "$0")" || exit 1

# Finder and Terminal can expose different PATH values on macOS.
for candidate in "${NODE_PATH_OVERRIDE:-node}" /opt/homebrew/bin/node /usr/local/bin/node; do
  if command -v "$candidate" >/dev/null 2>&1 && "$candidate" -e 'process.exit(Number(process.versions.node.split(".")[0]) >= 18 ? 0 : 1)' >/dev/null 2>&1; then
    exec "$candidate" server.mjs --open
  fi
done

printf '%s\n' \
  'Web Readability Radar needs Node.js 18 or newer.' \
  'Install a supported Node.js LTS release from https://nodejs.org/.' \
  'Choose the macOS installer for Apple Silicon or Intel, matching your Mac.' \
  'Then run: sh launch-mac-linux.sh' \
  'No npm install step is required.'
exit 1
