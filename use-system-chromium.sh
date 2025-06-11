#!/bin/bash

echo "=== Configure Puppeteer to use System Chromium ==="
echo ""

# Find chromium in Nix store
echo "1. Searching for Chromium in Nix store..."
CHROMIUM_PATH=""

# Search for chromium
for chromium in /nix/store/*/bin/chromium; do
    if [ -f "$chromium" ] && [ -x "$chromium" ]; then
        CHROMIUM_PATH="$chromium"
        echo "   Found: $CHROMIUM_PATH"
        break
    fi
done

if [ -z "$CHROMIUM_PATH" ]; then
    echo "   ❌ Chromium not found in Nix store"
    echo ""
    echo "   Make sure your .replit file includes:"
    echo '   [nix]'
    echo '   packages = ["chromium"]'
    exit 1
fi

echo ""
echo "2. Setting up environment..."

# Create or update .env file
if [ -f .env ]; then
    # Remove old PUPPETEER_EXECUTABLE_PATH if exists
    grep -v "PUPPETEER_EXECUTABLE_PATH" .env > .env.tmp
    mv .env.tmp .env
fi

# Add the executable path
echo "PUPPETEER_EXECUTABLE_PATH=$CHROMIUM_PATH" >> .env
echo "   Added to .env: PUPPETEER_EXECUTABLE_PATH=$CHROMIUM_PATH"

# Also export for current session
export PUPPETEER_EXECUTABLE_PATH="$CHROMIUM_PATH"

echo ""
echo "3. Testing configuration..."

node -e "
const puppeteer = require('puppeteer');
console.log('Executable path:', process.env.PUPPETEER_EXECUTABLE_PATH);
puppeteer.launch({
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
}).then(browser => {
  console.log('✅ Chromium works!');
  return browser.close();
}).catch(err => {
  console.error('❌ Error:', err.message);
});
"

echo ""
echo "=== Configuration Complete ==="
echo ""
echo "The system Chromium has been configured for Puppeteer."
echo "Your application should now be able to generate PDFs."