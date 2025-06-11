#!/bin/bash

echo "=== Chrome Installation for Puppeteer ==="
echo ""

# Set up environment
export PUPPETEER_CACHE_DIR="${HOME}/.cache/puppeteer"
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

echo "1. Environment setup:"
echo "   PUPPETEER_CACHE_DIR: $PUPPETEER_CACHE_DIR"
echo "   HOME: $HOME"

# Create cache directory
mkdir -p "$PUPPETEER_CACHE_DIR"

# Clean old installations
echo ""
echo "2. Cleaning old installations..."
rm -rf "$PUPPETEER_CACHE_DIR/chrome"
rm -rf "/home/runner/workspace/.cache/puppeteer"
rm -rf "./node_modules/puppeteer/.local-chromium"

# Install Chrome using puppeteer CLI
echo ""
echo "3. Installing Chrome browser..."
npx puppeteer browsers install chrome

# Check installation
echo ""
echo "4. Checking installation..."
if [ -d "$PUPPETEER_CACHE_DIR" ]; then
    echo "   Cache directory contents:"
    find "$PUPPETEER_CACHE_DIR" -type d -name "*chrome*" | head -10
    echo ""
    echo "   Chrome executables found:"
    find "$PUPPETEER_CACHE_DIR" -type f -name "chrome" -o -name "chrome-linux" | head -10
fi

# Create a test script
echo ""
echo "5. Creating test script..."
cat > test-chrome-direct.js << 'EOF'
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testChrome() {
  console.log('Testing Chrome installation...\n');
  
  // Check cache directory
  const cacheDir = process.env.PUPPETEER_CACHE_DIR || path.join(process.env.HOME, '.cache', 'puppeteer');
  console.log('Cache directory:', cacheDir);
  console.log('Cache exists:', fs.existsSync(cacheDir));
  
  try {
    // Try to launch browser
    console.log('\nAttempting to launch browser...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    console.log('✅ Browser launched successfully!');
    
    const page = await browser.newPage();
    await page.goto('data:text/html,<h1>Test Page</h1>');
    const title = await page.title();
    console.log('Page title:', title);
    
    await browser.close();
    console.log('✅ Chrome is working properly!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Try to find Chrome manually
    console.log('\nSearching for Chrome executables...');
    const searchPaths = [
      cacheDir,
      path.join(cacheDir, 'chrome'),
      '/usr/bin',
      '/usr/local/bin',
      '/opt/google/chrome',
    ];
    
    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        console.log(`Checking ${searchPath}...`);
        try {
          const files = fs.readdirSync(searchPath);
          const chromeFiles = files.filter(f => f.includes('chrome') || f.includes('chromium'));
          if (chromeFiles.length > 0) {
            console.log(`  Found: ${chromeFiles.join(', ')}`);
          }
        } catch (e) {
          // Ignore read errors
        }
      }
    }
  }
}

testChrome();
EOF

echo ""
echo "6. Running test..."
node test-chrome-direct.js

echo ""
echo "=== Installation complete ==="
echo ""
echo "If Chrome is still not found, try:"
echo "1. Export PUPPETEER_CACHE_DIR=$HOME/.cache/puppeteer"
echo "2. Run: npx puppeteer browsers install chrome"
echo "3. Check the Puppeteer configuration guide: https://pptr.dev/guides/configuration"