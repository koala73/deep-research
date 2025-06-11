#!/bin/bash

echo "=== Simple Chrome Setup for Puppeteer ==="
echo ""

# Ensure we're using the home directory cache
export PUPPETEER_CACHE_DIR="${HOME}/.cache/puppeteer"

echo "1. Setting up environment..."
mkdir -p "$PUPPETEER_CACHE_DIR"

# Clean install puppeteer
echo ""
echo "2. Installing Puppeteer (this will download Chrome)..."
npm install puppeteer@latest

# Verify installation
echo ""
echo "3. Verifying installation..."
node -e "
const puppeteer = require('puppeteer');
console.log('Puppeteer version:', require('puppeteer/package.json').version);
try {
  const browser = puppeteer.launch({ headless: 'new' });
  console.log('✓ Puppeteer can launch browser');
  browser.then(b => b.close());
} catch (e) {
  console.log('✗ Error:', e.message);
}
"

echo ""
echo "Setup complete! Run 'node test-pdf.js' to test PDF generation."