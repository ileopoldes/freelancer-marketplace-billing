#!/bin/bash
set -e

echo "Starting frontend build..."
echo "Working directory: $(pwd)"
echo "Node: $(node --version 2>/dev/null || echo 'not found')"
echo "NPM: $(npm --version 2>/dev/null || echo 'not found')"

echo "Preparing shared package files..."

# Clean existing shared directory to prevent recursive copying
rm -rf src/shared

copy_ts_files() {
    local source_dir="$1"
    local target_dir="$2"
    echo "Copying from $source_dir to $target_dir"
    mkdir -p "$target_dir"
    
    # Only copy files that don't contain 'src/shared' in their path to avoid recursion
    (cd "$source_dir" && find . -name "*.ts" -type f ! -path "*/src/shared/*" -print0 | while IFS= read -r -d '' file; do
        target_file="$target_dir/$file"
        target_dir_only=$(dirname "$target_file")
        mkdir -p "$target_dir_only"
        cp "$file" "$target_file"
        echo "Copied: $file -> $target_file"
    done)
}

# Find and copy shared package
if [ -d "../../packages/shared/src" ]; then
    echo "Found monorepo shared package"
    copy_ts_files "../../packages/shared/src" "src/shared"
elif [ -d "../shared/src" ]; then
    echo "Found shared package at ../shared"
    copy_ts_files "../shared/src" "src/shared"
else
    echo "No shared package found locally"
fi

# Verify copied files
if [ -d "src/shared" ]; then
    echo "Shared files copied:"
    find src/shared -name "*.ts" | head -10
else
    echo "Warning: No shared files were copied"
fi

# Run the Next.js build
npx next build

echo "Build completed successfully!"

