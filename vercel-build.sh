#!/bin/bash

# Build script for Vercel
npm run build

# Copy build output to dist directory
cp -r dist/* .vercel/output/static/

# Create _headers file for SPA routing
echo "/*    /index.html   200" > .vercel/output/static/_headers