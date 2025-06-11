#!/bin/bash

echo "=== Chrome/Puppeteer Fix Script ==="
echo ""

# Set cache directory
export PUPPETEER_CACHE_DIR="${PUPPETEER_CACHE_DIR:-/home/runner/workspace/.cache/puppeteer}"

echo "1. Setting Puppeteer cache directory to: $PUPPETEER_CACHE_DIR"
mkdir -p "$PUPPETEER_CACHE_DIR"

echo ""
echo "2. Installing Chrome via Puppeteer..."
npx puppeteer browsers install chrome

echo ""
echo "3. Checking installation..."
if [ -d "$PUPPETEER_CACHE_DIR" ]; then
    echo "   Cache directory contents:"
    find "$PUPPETEER_CACHE_DIR" -name "chrome" -type f 2>/dev/null | head -5
fi

echo ""
echo "4. Setting environment variable in .env..."
if [ -f .env ]; then
    grep -q "PUPPETEER_CACHE_DIR" .env || echo "PUPPETEER_CACHE_DIR=$PUPPETEER_CACHE_DIR" >> .env
    grep -q "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" .env || echo "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false" >> .env
    echo "   Environment variables added to .env"
else
    echo "   No .env file found, creating one..."
    echo "PUPPETEER_CACHE_DIR=$PUPPETEER_CACHE_DIR" > .env
    echo "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false" >> .env
fi

echo ""
echo "5. Testing Chrome executable..."
node -e "
try {
  const puppeteer = require('puppeteer');
  const path = puppeteer.executablePath();
  console.log('   Puppeteer executable:', path);
  console.log('   Exists:', require('fs').existsSync(path));
} catch (e) {
  console.log('   Error:', e.message);
}
"

echo ""
echo "=== Fix Complete ==="
echo ""
echo "If Chrome is still not found, try:"
echo "1. Run: npm install"
echo "2. Run: node test-pdf.js"
echo "3. Check the error messages for the actual cache path being used"