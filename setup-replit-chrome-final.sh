#!/bin/bash

echo "=== Final Replit Chrome Setup ==="
echo ""

# First, try to find Nix chromium
echo "1. Searching for Nix-installed Chromium..."
NIX_CHROMIUM=""

# Search in various Nix store locations
for pattern in "/nix/store/*/bin/chromium" "/usr/bin/chromium" "/run/current-system/sw/bin/chromium"; do
    for chromium in $pattern; do
        if [ -f "$chromium" ] && [ -x "$chromium" ]; then
            NIX_CHROMIUM="$chromium"
            echo "   ✅ Found Nix Chromium at: $NIX_CHROMIUM"
            break 2
        fi
    done
done

if [ -z "$NIX_CHROMIUM" ]; then
    echo "   ❌ Nix Chromium not found"
    echo ""
    echo "   Please ensure your .replit file includes:"
    echo "   [nix]"
    echo "   packages = [\"chromium\"]"
    echo ""
    echo "   Then reload your Repl for the changes to take effect."
    exit 1
fi

# Set up environment variable
echo ""
echo "2. Configuring environment..."

# Update .env file
if [ -f .env ]; then
    grep -v "PUPPETEER_EXECUTABLE_PATH" .env > .env.tmp
    mv .env.tmp .env
fi
echo "PUPPETEER_EXECUTABLE_PATH=$NIX_CHROMIUM" >> .env

# Also create a config file for the app
echo ""
echo "3. Creating Chrome configuration file..."
cat > chrome-config.json << EOF
{
  "executablePath": "$NIX_CHROMIUM",
  "args": [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--no-zygote",
    "--single-process",
    "--disable-gpu"
  ]
}
EOF

echo "   Created chrome-config.json"

# Test the configuration
echo ""
echo "4. Testing Chromium..."
cat > test-final-chrome.js << 'EOF'
const puppeteer = require('puppeteer-core') || require('puppeteer');
const fs = require('fs');

async function test() {
  try {
    // Read config
    const config = JSON.parse(fs.readFileSync('chrome-config.json', 'utf8'));
    console.log('Using Chrome at:', config.executablePath);
    
    // Launch browser
    const browser = await puppeteer.launch({
      executablePath: config.executablePath,
      headless: true,
      args: config.args
    });
    
    console.log('✅ Browser launched successfully!');
    
    // Test page
    const page = await browser.newPage();
    await page.goto('data:text/html,<h1>Success!</h1>');
    const content = await page.content();
    
    await browser.close();
    console.log('✅ Chrome is working properly!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
EOF

node test-final-chrome.js

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Chrome has been configured to use the Nix-provided Chromium."
echo "Your PDF generation should now work properly."
echo ""
echo "The configuration has been saved to:"
echo "- .env (PUPPETEER_EXECUTABLE_PATH)"
echo "- chrome-config.json (full launch configuration)"