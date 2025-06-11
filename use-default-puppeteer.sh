#!/bin/bash

echo "=== Configuring to use default Puppeteer ==="
echo ""

# Remove chrome-config.json to use default Puppeteer behavior
echo "1. Removing custom chrome configuration..."
rm -f chrome-config.json
echo "   ✅ Removed chrome-config.json"

# Ensure we have the standard Puppeteer installed
echo ""
echo "2. Ensuring Puppeteer is properly installed..."
npm install puppeteer@latest

# Test with default Puppeteer
echo ""
echo "3. Testing default Puppeteer..."

cat > test-default-puppeteer.js << 'EOF'
const puppeteer = require('puppeteer');

async function test() {
  try {
    console.log('Launching browser with default Puppeteer settings...');
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--no-zygote'
      ]
    });
    
    console.log('✅ Browser launched successfully!');
    
    const page = await browser.newPage();
    await page.goto('data:text/html,<h1>Puppeteer Works!</h1>');
    const title = await page.title();
    console.log('Page title:', title);
    
    await browser.close();
    console.log('✅ Success! Default Puppeteer is working.');
    
    console.log('\nYour PDF generation should now work using the bundled Chromium.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nTroubleshooting steps:');
    console.log('1. Run: npm install puppeteer@latest');
    console.log('2. Make sure no chrome-config.json file exists');
    console.log('3. Try restarting your Repl');
  }
}

test();
EOF

node test-default-puppeteer.js

echo ""
echo "=== Configuration Complete ==="
echo ""
echo "The system is now configured to use Puppeteer's bundled Chromium."
echo "This should work without any additional setup."