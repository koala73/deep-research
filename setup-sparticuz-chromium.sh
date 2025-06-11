#!/bin/bash

echo "=== Installing @sparticuz/chromium for Puppeteer ==="
echo ""

# Install the chromium package
echo "1. Installing @sparticuz/chromium..."
npm install @sparticuz/chromium@133.0.0

# Install puppeteer-core (lighter version without bundled Chrome)
echo ""
echo "2. Installing puppeteer-core..."
npm install puppeteer-core

echo ""
echo "3. Creating test script..."

cat > test-sparticuz.js << 'EOF'
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

async function testChromium() {
  console.log('Testing @sparticuz/chromium with Puppeteer...\n');
  
  try {
    // Get the executable path from @sparticuz/chromium
    const executablePath = await chromium.executablePath();
    console.log('Chromium path:', executablePath);
    
    // Launch browser
    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: executablePath,
      headless: chromium.headless,
    });
    
    console.log('✅ Browser launched successfully!');
    
    // Test basic functionality
    const page = await browser.newPage();
    await page.goto('data:text/html,<h1>Test Page</h1>');
    const title = await page.title();
    console.log('Page title:', title);
    
    await browser.close();
    console.log('✅ Chromium is working properly!');
    
    console.log('\n=== Configuration for your app ===');
    console.log('Use puppeteer-core instead of puppeteer');
    console.log('Set executable path using: await chromium.executablePath()');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testChromium();
EOF

echo ""
echo "4. Running test..."
node test-sparticuz.js

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To use this in your application, update pdf-generator.ts to use:"
echo "- puppeteer-core instead of puppeteer"
echo "- @sparticuz/chromium for the executable path"