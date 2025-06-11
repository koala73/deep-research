#!/bin/bash

echo "=== Installing Chrome Dependencies ==="
echo ""

# Check if we're in Replit
if [ -n "$REPL_ID" ] || [ -n "$REPLIT" ]; then
    echo "Detected Replit environment"
    echo ""
    echo "For Replit, Chrome dependencies should be handled via Nix packages."
    echo "The missing libraries indicate we need to use the Nix-provided Chromium instead."
    echo ""
    echo "Checking for Nix Chromium..."
    
    # Look for chromium in common Nix locations
    NIX_PATHS=(
        "/nix/store/*/bin/chromium"
        "/usr/bin/chromium"
        "/run/current-system/sw/bin/chromium"
    )
    
    for pattern in "${NIX_PATHS[@]}"; do
        for path in $pattern; do
            if [ -f "$path" ] && [ -x "$path" ]; then
                echo "✅ Found Chromium at: $path"
                echo ""
                echo "To use this Chromium with Puppeteer, set:"
                echo "export PUPPETEER_EXECUTABLE_PATH=$path"
                FOUND_CHROMIUM="$path"
                break 2
            fi
        done
    done
    
    if [ -z "$FOUND_CHROMIUM" ]; then
        echo "❌ No system Chromium found"
        echo ""
        echo "Please ensure 'chromium' is in your .replit [nix] packages"
    fi
else
    # For regular Linux systems
    echo "Installing Chrome dependencies for Linux..."
    
    # Detect package manager
    if command -v apt-get &> /dev/null; then
        echo "Using apt-get..."
        sudo apt-get update
        sudo apt-get install -y \
            libnss3 \
            libatk1.0-0 \
            libatk-bridge2.0-0 \
            libcups2 \
            libdrm2 \
            libxkbcommon0 \
            libxcomposite1 \
            libxdamage1 \
            libxrandr2 \
            libgbm1 \
            libpango-1.0-0 \
            libcairo2 \
            libasound2 \
            libglib2.0-0 \
            libgtk-3-0 \
            libxss1 \
            libxtst6 \
            fonts-liberation
    elif command -v yum &> /dev/null; then
        echo "Using yum..."
        sudo yum install -y \
            alsa-lib \
            atk \
            cups-libs \
            gtk3 \
            libXcomposite \
            libXcursor \
            libXdamage \
            libXext \
            libXi \
            libXrandr \
            libXScrnSaver \
            libXtst \
            pango \
            xorg-x11-fonts-100dpi \
            xorg-x11-fonts-75dpi \
            xorg-x11-fonts-cyrillic \
            xorg-x11-fonts-misc \
            xorg-x11-fonts-Type1 \
            xorg-x11-utils
    else
        echo "❌ Unsupported package manager"
    fi
fi

echo ""
echo "=== Testing Chrome/Chromium ==="

# Create test script
cat > test-chromium-system.js << 'EOF'
const puppeteer = require('puppeteer');

async function testWithSystemChromium() {
  const executablePaths = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/nix/store/chromium/bin/chromium',
    ...require('glob').sync('/nix/store/*/bin/chromium'),
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ].filter(Boolean);

  console.log('Searching for working Chromium...\n');

  for (const execPath of executablePaths) {
    if (!require('fs').existsSync(execPath)) continue;
    
    console.log(`Testing: ${execPath}`);
    try {
      const browser = await puppeteer.launch({
        executablePath: execPath,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
      });
      
      console.log('✅ Success! Working Chromium found.');
      console.log(`\nAdd to your .env file:`);
      console.log(`PUPPETEER_EXECUTABLE_PATH=${execPath}\n`);
      
      await browser.close();
      return execPath;
    } catch (err) {
      console.log(`❌ Failed: ${err.message.split('\n')[0]}\n`);
    }
  }
  
  console.log('No working Chromium found. Trying default Puppeteer...');
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    console.log('✅ Default Puppeteer Chrome works!');
    await browser.close();
  } catch (err) {
    console.log('❌ Default also failed:', err.message);
  }
}

testWithSystemChromium();
EOF

# Install glob for the test script
npm install --no-save glob

echo ""
node test-chromium-system.js

echo ""
echo "=== Setup Complete ==="
echo ""
echo "If a working Chromium was found, add the PUPPETEER_EXECUTABLE_PATH to your .env file"