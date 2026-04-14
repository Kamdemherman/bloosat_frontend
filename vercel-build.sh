#!/usr/bin/env bash

# Build script for Vercel
set -e

npm run build

# Copy build output to dist directory
mkdir -p .vercel/output/static
cp -r dist/* .vercel/output/static/

# Create _headers file for SPA routing
echo "/*    /index.html   200" > .vercel/output/static/_headers