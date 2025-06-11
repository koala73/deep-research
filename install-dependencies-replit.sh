#!/bin/bash

echo "=== Installing Chrome Dependencies for Replit ==="
echo ""

# Install system dependencies using Nix
echo "1. Installing system libraries via Nix..."

# Create a shell.nix file for dependencies
cat > shell.nix << 'EOF'
{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Core libraries needed by Chrome
    glib
    nss
    nspr
    atk
    cups
    dbus
    libdrm
    xorg.libXcomposite
    xorg.libXdamage
    xorg.libXrandr
    xorg.libxcb
    xorg.libXext
    xorg.libX11
    xorg.libXfixes
    expat
    alsaLib
    pango
    cairo
    at-spi2-atk
    at-spi2-core
    xorg.libxkbcommon
    gtk3
    gdk-pixbuf
    # Fonts
    liberation_ttf
    # Chrome/Chromium
    chromium
  ];

  shellHook = ''
    export LD_LIBRARY_PATH="${pkgs.lib.makeLibraryPath [
      pkgs.glib
      pkgs.nss
      pkgs.nspr
      pkgs.atk
      pkgs.cups
      pkgs.dbus
      pkgs.libdrm
      pkgs.xorg.libXcomposite
      pkgs.xorg.libXdamage
      pkgs.xorg.libXrandr
      pkgs.xorg.libxcb
      pkgs.xorg.libXext
      pkgs.xorg.libX11
      pkgs.xorg.libXfixes
      pkgs.expat
      pkgs.alsaLib
      pkgs.pango
      pkgs.cairo
      pkgs.at-spi2-atk
      pkgs.at-spi2-core
      pkgs.xorg.libxkbcommon
      pkgs.gtk3
      pkgs.gdk-pixbuf
    ]}:$LD_LIBRARY_PATH"
    
    echo "Chrome dependencies loaded"
  '';
}
EOF

echo "   Created shell.nix"

# Option 1: Use system Chromium
echo ""
echo "2. Setting up to use system Chromium..."

# Find chromium in Nix environment
CHROMIUM_PATH=""
if command -v chromium &> /dev/null; then
    CHROMIUM_PATH=$(which chromium)
    echo "   ✅ Found system chromium at: $CHROMIUM_PATH"
    
    # Create config for system chromium
    cat > chrome-config.json << EOF
{
  "executablePath": "$CHROMIUM_PATH",
  "args": [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--headless"
  ]
}
EOF
    echo "   Created chrome-config.json for system chromium"
else
    echo "   ❌ System chromium not found"
fi

# Option 2: Install Chrome via Puppeteer with proper environment
echo ""
echo "3. Installing Chrome for Puppeteer..."

# Set up environment
export PUPPETEER_CACHE_DIR="$HOME/.cache/puppeteer"
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

# Clean and reinstall
rm -rf "$PUPPETEER_CACHE_DIR"
npx puppeteer browsers install chrome

# Option 3: Use playwright-chromium as alternative
echo ""
echo "4. Installing playwright-chromium as alternative..."
npm install playwright-chromium

# Create a test script that tries all options
echo ""
echo "5. Creating comprehensive test script..."

cat > test-all-options.js << 'EOF'
const fs = require('fs');

async function testOption(name, launchFunc) {
  console.log(`\nTesting ${name}...`);
  try {
    const browser = await launchFunc();
    console.log(`✅ ${name} works!`);
    
    const page = await browser.newPage();
    await page.goto('data:text/html,<h1>Success!</h1>');
    await browser.close();
    
    return true;
  } catch (error) {
    console.log(`❌ ${name} failed:`, error.message.split('\n')[0]);
    return false;
  }
}

async function findWorkingChrome() {
  // Option 1: Chrome config file
  if (fs.existsSync('chrome-config.json')) {
    const config = JSON.parse(fs.readFileSync('chrome-config.json', 'utf8'));
    const puppeteer = require('puppeteer-core') || require('puppeteer');
    
    if (await testOption('System Chromium', () => puppeteer.launch({
      executablePath: config.executablePath,
      headless: true,
      args: config.args
    }))) {
      console.log('\n✅ Use system chromium via chrome-config.json');
      return;
    }
  }
  
  // Option 2: Standard Puppeteer
  try {
    const puppeteer = require('puppeteer');
    if (await testOption('Puppeteer bundled Chrome', () => puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    }))) {
      console.log('\n✅ Use standard Puppeteer (remove chrome-config.json)');
      fs.unlinkSync('chrome-config.json');
      return;
    }
  } catch (e) {}
  
  // Option 3: Playwright
  try {
    const { chromium } = require('playwright-chromium');
    if (await testOption('Playwright Chromium', () => chromium.launch({
      headless: true
    }))) {
      console.log('\n✅ Use playwright-chromium instead of puppeteer');
      
      // Create config for playwright
      fs.writeFileSync('use-playwright.json', JSON.stringify({
        usePlaywright: true
      }, null, 2));
      return;
    }
  } catch (e) {}
  
  console.log('\n❌ No working Chrome/Chromium found');
  console.log('\nTry these steps:');
  console.log('1. Reload your Repl to ensure Nix packages are loaded');
  console.log('2. Run: nix-shell');
  console.log('3. Then run this script again');
}

findWorkingChrome();
EOF

echo ""
echo "6. Running tests..."
node test-all-options.js

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Follow the recommendation from the test above."