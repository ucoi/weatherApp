#\!/bin/bash
set -e
npx tsc
cp index.html dist/
cp style.css dist/
