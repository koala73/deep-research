#!/bin/bash

echo "=== Creating Chromium Wrapper for Replit ==="
echo ""

# Check if chromium is available
if ! command -v chromium &> /dev/null; then
    echo "❌ Error: chromium command not found"
    echo ""
    echo "Please reload your Repl to ensure Nix packages are loaded"
    exit 1
fi

echo "1. Found chromium at: $(which chromium)"

# Create a wrapper script that ensures proper environment
echo ""
echo "2. Creating chromium wrapper..."

cat > chromium-wrapper.sh << 'EOF'
#!/bin/bash
# Chromium wrapper for Puppeteer in Replit

# Set required environment variables
export DISPLAY=:99
export XDG_RUNTIME_DIR=/tmp/runtime-$USER
mkdir -p "$XDG_RUNTIME_DIR"

# Run chromium with all arguments passed through
exec chromium "$@"
EOF

chmod +x chromium-wrapper.sh

# Create chrome-config.json pointing to the wrapper
WRAPPER_PATH="$(pwd)/chromium-wrapper.sh"
echo ""
echo "3. Creating chrome-config.json..."

cat > chrome-config.json << EOF
{
  "executablePath": "$WRAPPER_PATH",
  "args": [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--disable-software-rasterizer",
    "--disable-background-timer-throttling",
    "--disable-backgrounding-occluded-windows",
    "--disable-renderer-backgrounding",
    "--disable-features=TranslateUI",
    "--disable-ipc-flooding-protection",
    "--disable-default-apps",
    "--no-first-run",
    "--no-default-browser-check",
    "--no-pings",
    "--password-store=basic",
    "--use-mock-keychain",
    "--headless"
  ]
}
EOF

echo "   ✅ Created chrome-config.json"

# Test the setup
echo ""
echo "4. Testing setup..."

cat > test-wrapper.js << 'EOF'
const puppeteer = require('puppeteer-core') || require('puppeteer');
const fs = require('fs');
const { spawn } = require('child_process');

async function test() {
  try {
    const config = JSON.parse(fs.readFileSync('chrome-config.json', 'utf8'));
    console.log('Using wrapper:', config.executablePath);
    
    // First test if chromium runs at all
    console.log('\nTesting chromium directly...');
    const chromiumTest = spawn(config.executablePath, ['--version']);
    
    chromiumTest.stdout.on('data', (data) => {
      console.log('Chromium version:', data.toString().trim());
    });
    
    chromiumTest.stderr.on('data', (data) => {
      console.error('Chromium stderr:', data.toString());
    });
    
    await new Promise((resolve) => {
      chromiumTest.on('close', resolve);
    });
    
    // Now test with Puppeteer
    console.log('\nTesting with Puppeteer...');
    const browser = await puppeteer.launch({
      executablePath: config.executablePath,
      headless: true,
      args: config.args,
      dumpio: true  // Show browser output for debugging
    });
    
    console.log('✅ Browser launched!');
    
    const page = await browser.newPage();
    await page.goto('data:text/html,<h1>Chromium Works!</h1>');
    const title = await page.title();
    console.log('Page title:', title);
    
    await browser.close();
    console.log('✅ Success! Chromium wrapper works.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    // If it fails, try direct chromium command
    console.log('\nTrying direct chromium command...');
    const directConfig = {
      executablePath: 'chromium',
      args: config.args
    };
    
    fs.writeFileSync('chrome-config.json', JSON.stringify(directConfig, null, 2));
    console.log('Updated chrome-config.json to use direct chromium command');
  }
}

test();
EOF

node test-wrapper.js

echo ""
echo "=== Setup Complete ==="
echo ""
echo "If the test succeeded, your PDF generation should now work."
echo "If not, try using the direct chromium command in chrome-config.json"