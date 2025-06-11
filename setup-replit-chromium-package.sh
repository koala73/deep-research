#!/bin/bash

echo "=== Setup for Replit chromium@3.0.3 package ==="
echo ""

# Install the chromium package if not already installed
echo "1. Checking chromium package..."
if ! npm list chromium >/dev/null 2>&1; then
    echo "   Installing chromium@3.0.3..."
    npm install chromium@3.0.3
else
    echo "   ✅ chromium package already installed"
fi

# Find the chromium executable
echo ""
echo "2. Locating chromium executable..."

# Check common locations for the chromium package
CHROMIUM_PATHS=(
    "./node_modules/chromium/lib/chromium/chrome-linux/chrome"
    "./node_modules/chromium/.local-chromium/linux-*/chrome-linux/chrome"
    "./node_modules/.cache/chromium/linux-*/chrome-linux/chrome"
)

CHROMIUM_EXEC=""
for path_pattern in "${CHROMIUM_PATHS[@]}"; do
    for path in $path_pattern; do
        if [ -f "$path" ] && [ -x "$path" ]; then
            CHROMIUM_EXEC="$path"
            echo "   ✅ Found chromium at: $CHROMIUM_EXEC"
            break 2
        fi
    done
done

# Also check using the chromium package's API
if [ -z "$CHROMIUM_EXEC" ]; then
    echo "   Checking via chromium package API..."
    CHROMIUM_EXEC=$(node -e "try { console.log(require('chromium').path) } catch(e) {}" 2>/dev/null)
    if [ -n "$CHROMIUM_EXEC" ] && [ -f "$CHROMIUM_EXEC" ]; then
        echo "   ✅ Found via API: $CHROMIUM_EXEC"
    else
        CHROMIUM_EXEC=""
    fi
fi

if [ -z "$CHROMIUM_EXEC" ]; then
    echo "   ❌ Could not find chromium executable"
    echo "   Try running: npx chromium --help"
    exit 1
fi

# Create configuration
echo ""
echo "3. Creating configuration..."

# Update .env
if [ -f .env ]; then
    grep -v "PUPPETEER_EXECUTABLE_PATH" .env > .env.tmp
    mv .env.tmp .env
fi
echo "PUPPETEER_EXECUTABLE_PATH=$CHROMIUM_EXEC" >> .env

# Create chrome-config.json
cat > chrome-config.json << EOF
{
  "executablePath": "$CHROMIUM_EXEC",
  "args": [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--no-first-run",
    "--no-zygote",
    "--disable-gpu",
    "--disable-web-security",
    "--disable-features=IsolateOrigins,site-per-process"
  ]
}
EOF

echo "   ✅ Created chrome-config.json"

# Test the setup
echo ""
echo "4. Testing chromium..."

cat > test-chromium-package.js << 'EOF'
const puppeteer = require('puppeteer-core') || require('puppeteer');
const fs = require('fs');

async function test() {
  try {
    const config = JSON.parse(fs.readFileSync('chrome-config.json', 'utf8'));
    console.log('Using chromium at:', config.executablePath);
    
    // Check if file exists
    if (!fs.existsSync(config.executablePath)) {
      throw new Error('Chromium executable not found at: ' + config.executablePath);
    }
    
    console.log('File exists, attempting to launch...');
    
    const browser = await puppeteer.launch({
      executablePath: config.executablePath,
      headless: true,
      args: config.args
    });
    
    console.log('✅ Browser launched!');
    
    const page = await browser.newPage();
    await page.goto('data:text/html,<h1>Chromium Works!</h1>');
    const title = await page.title();
    console.log('Page title:', title);
    
    await browser.close();
    console.log('✅ Success! Chromium is working properly.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // Try alternative approach
    console.log('\nTrying alternative approach with chromium package directly...');
    try {
      const chromium = require('chromium');
      console.log('Chromium path from package:', chromium.path);
      
      // Test with minimal args
      const browser = await puppeteer.launch({
        executablePath: chromium.path,
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      console.log('✅ Alternative approach worked!');
      await browser.close();
      
      // Update config with working setup
      fs.writeFileSync('chrome-config.json', JSON.stringify({
        executablePath: chromium.path,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      }, null, 2));
      
    } catch (altError) {
      console.error('Alternative also failed:', altError.message);
    }
  }
}

test();
EOF

node test-chromium-package.js

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Configuration saved to chrome-config.json"
echo "The pdf-generator will automatically use this configuration."