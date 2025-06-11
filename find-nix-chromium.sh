#!/bin/bash

echo "=== Finding Nix Chromium in Replit ==="
echo ""

# First check if chromium command is available
echo "1. Checking if chromium is in PATH..."
if command -v chromium &> /dev/null; then
    CHROMIUM_PATH=$(which chromium)
    echo "   ✅ Found chromium command at: $CHROMIUM_PATH"
    
    # Follow symlinks to get real path
    REAL_PATH=$(readlink -f "$CHROMIUM_PATH")
    echo "   Real path: $REAL_PATH"
else
    echo "   ❌ chromium command not found in PATH"
fi

# Search Nix store
echo ""
echo "2. Searching Nix store..."
if [ -d "/nix/store" ]; then
    echo "   Searching for chromium binaries..."
    CHROMIUM_BINS=$(find /nix/store -maxdepth 3 -name "chromium" -type f -executable 2>/dev/null | grep -E "bin/chromium$" | head -5)
    
    if [ -n "$CHROMIUM_BINS" ]; then
        echo "   Found chromium binaries:"
        echo "$CHROMIUM_BINS" | while read -r bin; do
            echo "   - $bin"
        done
        
        # Use the first one found
        NIX_CHROMIUM=$(echo "$CHROMIUM_BINS" | head -1)
    else
        echo "   ❌ No chromium binaries found in Nix store"
    fi
fi

# Check environment
echo ""
echo "3. Checking environment..."
echo "   PATH: $PATH"
echo ""
echo "   Nix-related variables:"
env | grep -i nix | head -10

# Try to run chromium directly
echo ""
echo "4. Testing chromium command..."
if command -v chromium &> /dev/null; then
    chromium --version 2>&1 | head -1
    
    # Create config using system chromium
    CHROMIUM_CMD=$(which chromium)
    echo ""
    echo "5. Creating chrome-config.json with system chromium..."
    cat > chrome-config.json << EOF
{
  "executablePath": "$CHROMIUM_CMD",
  "args": [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--headless"
  ]
}
EOF
    echo "   ✅ Created chrome-config.json"
    
    # Test it
    echo ""
    echo "6. Testing with Puppeteer..."
    cat > test-system-chromium.js << 'EOF'
const puppeteer = require('puppeteer-core') || require('puppeteer');
const fs = require('fs');

async function test() {
  try {
    const config = JSON.parse(fs.readFileSync('chrome-config.json', 'utf8'));
    console.log('Using:', config.executablePath);
    
    const browser = await puppeteer.launch({
      executablePath: config.executablePath,
      headless: true,
      args: config.args
    });
    
    console.log('✅ Browser launched successfully!');
    
    const page = await browser.newPage();
    await page.goto('data:text/html,<h1>Success!</h1>');
    
    await browser.close();
    console.log('✅ Chromium works!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
EOF
    
    node test-system-chromium.js
else
    echo "   ❌ chromium command not available"
    echo ""
    echo "   Please ensure your .replit file includes:"
    echo "   [nix]"
    echo "   packages = [\"chromium\"]"
fi

echo ""
echo "=== Done ==="