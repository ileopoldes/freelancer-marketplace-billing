#!/bin/bash
set -e

echo "Starting frontend build (Docker)..."
echo "Working directory: $(pwd)"
echo "Node: $(node --version 2>/dev/null || echo 'not found')"
echo "NPM: $(npm --version 2>/dev/null || echo 'not found')"

# In Docker, shared files are already copied by the Dockerfile
# Just run the Next.js build
echo "Running Next.js build..."
npx next build

echo "Build completed successfully!"

