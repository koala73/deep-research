#!/bin/bash

echo "=== Puppeteer Chrome Installation for Replit ==="
echo ""

# Set the cache directory
export PUPPETEER_CACHE_DIR="${HOME}/.cache/puppeteer"
echo "1. Setting cache directory to: $PUPPETEER_CACHE_DIR"
mkdir -p "$PUPPETEER_CACHE_DIR"

# Remove old cache if exists
if [ -d "/home/runner/workspace/.cache/puppeteer" ]; then
    echo "2. Removing old cache directory..."
    rm -rf "/home/runner/workspace/.cache/puppeteer"
fi

# Install puppeteer with Chrome
echo ""
echo "3. Installing Puppeteer with Chrome..."
npm install puppeteer --save

# Force Chrome installation
echo ""
echo "4. Installing Chrome browser..."
cd node_modules/puppeteer
npm run postinstall
cd ../..

# Verify installation
echo ""
echo "5. Verifying installation..."
node -e "
const puppeteer = require('puppeteer');
try {
  const execPath = puppeteer.executablePath();
  console.log('Chrome executable path:', execPath);
  console.log('Chrome exists:', require('fs').existsSync(execPath));
} catch (e) {
  console.error('Error:', e.message);
}
"

echo ""
echo "6. Setting up environment..."
# Create or update .env file
if [ ! -f .env ]; then
    touch .env
fi

# Add environment variables
grep -q "PUPPETEER_CACHE_DIR" .env || echo "PUPPETEER_CACHE_DIR=${HOME}/.cache/puppeteer" >> .env
grep -q "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD" .env || echo "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false" >> .env

echo "Environment variables added to .env"

echo ""
echo "=== Installation Complete ==="
echo ""
echo "To test PDF generation, run: node test-pdf.js"