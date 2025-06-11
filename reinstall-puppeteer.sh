#!/bin/bash

echo "=== Fresh Puppeteer Installation ==="
echo ""

# Remove existing puppeteer
echo "1. Removing existing Puppeteer installation..."
npm uninstall puppeteer puppeteer-core

# Clean all cache directories
echo ""
echo "2. Cleaning cache directories..."
rm -rf "$HOME/.cache/puppeteer"
rm -rf "/home/runner/.cache/puppeteer"
rm -rf "/home/runner/workspace/.cache/puppeteer"
rm -rf "./node_modules/puppeteer"
rm -rf "./.cache"

# Set environment
export PUPPETEER_CACHE_DIR="$HOME/.cache/puppeteer"
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

echo ""
echo "3. Installing Puppeteer fresh..."
npm install puppeteer@latest

# Verify Chrome was downloaded
echo ""
echo "4. Verifying Chrome installation..."
if [ -d "$PUPPETEER_CACHE_DIR" ]; then
    echo "Cache contents:"
    ls -la "$PUPPETEER_CACHE_DIR"
    
    # Find Chrome
    CHROME_PATH=$(find "$PUPPETEER_CACHE_DIR" -name "chrome" -type f 2>/dev/null | head -1)
    if [ -n "$CHROME_PATH" ]; then
        echo ""
        echo "✅ Chrome found at: $CHROME_PATH"
        echo "File info: $(file "$CHROME_PATH")"
    else
        echo ""
        echo "❌ Chrome executable not found in cache"
        echo ""
        echo "Attempting manual Chrome installation..."
        npx puppeteer browsers install chrome
    fi
else
    echo "❌ Cache directory not created"
fi

echo ""
echo "5. Testing Puppeteer..."
node -e "
const puppeteer = require('puppeteer');
puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  .then(browser => {
    console.log('✅ Puppeteer works!');
    return browser.close();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });
"

echo ""
echo "=== Installation Complete ==="