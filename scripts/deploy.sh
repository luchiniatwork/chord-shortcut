#!/usr/bin/env bash
# deploy.sh -- Package the Chord Shortcut extension for Chrome Web Store upload
#
# Usage:
#   ./scripts/deploy.sh
#
# Output:
#   dist/chord-shortcut-<version>.zip

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$PROJECT_ROOT/dist"

# ---- Read version from manifest.json ----

VERSION=$(grep '"version"' "$PROJECT_ROOT/manifest.json" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')

if [ -z "$VERSION" ]; then
  echo "Error: could not read version from manifest.json" >&2
  exit 1
fi

ZIP_NAME="chord-shortcut-${VERSION}.zip"
ZIP_PATH="$DIST_DIR/$ZIP_NAME"

echo "Packaging Chord Shortcut v${VERSION}..."

# ---- Validate required files exist ----

REQUIRED_FILES=(
  "manifest.json"
  "background.js"
  "content.js"
  "options.html"
  "options.js"
  "options.css"
  "icons/icon16.png"
  "icons/icon48.png"
  "icons/icon128.png"
)

MISSING=0
for file in "${REQUIRED_FILES[@]}"; do
  if [ ! -f "$PROJECT_ROOT/$file" ]; then
    echo "Error: missing required file: $file" >&2
    MISSING=1
  fi
done

if [ "$MISSING" -eq 1 ]; then
  exit 1
fi

# ---- Create dist directory ----

mkdir -p "$DIST_DIR"

# ---- Remove old zip if it exists ----

if [ -f "$ZIP_PATH" ]; then
  rm "$ZIP_PATH"
  echo "Removed existing $ZIP_NAME"
fi

# ---- Build the zip ----
# Include only the files the extension needs at runtime.
# Exclude docs, scripts, dotfiles, and non-extension metadata.

(
  cd "$PROJECT_ROOT"
  zip -r "$ZIP_PATH" \
    manifest.json \
    background.js \
    content.js \
    options.html \
    options.js \
    options.css \
    icons/ \
    -x "icons/.DS_Store"
)

# ---- Summary ----

SIZE=$(du -h "$ZIP_PATH" | cut -f1)

echo ""
echo "Done! Created $ZIP_NAME ($SIZE)"
echo "  Path: $ZIP_PATH"
echo ""
echo "Next steps:"
echo "  1. Go to https://chrome.google.com/webstore/devconsole"
echo "  2. Click 'New Item' (or select existing extension for updates)"
echo "  3. Upload $ZIP_PATH"
echo "  4. Fill in store listing and submit for review"
echo ""
echo "See docs/publishing.md for the full publishing guide."
