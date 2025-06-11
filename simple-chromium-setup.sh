#!/bin/bash

echo "=== Simple Chromium Setup ==="
echo ""

# Just use the chromium command directly
echo "1. Creating chrome-config.json..."

cat > chrome-config.json << 'EOF'
{
  "executablePath": "chromium",
  "args": [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--headless=new"
  ]
}
EOF

echo "   ✅ Created chrome-config.json"

# Quick test
echo ""
echo "2. Quick test..."

cat > quick-test.js << 'EOF'
const puppeteer = require('puppeteer-core') || require('puppeteer');
const config = require('./chrome-config.json');

puppeteer.launch({
  executablePath: config.executablePath,
  headless: true,
  args: config.args
}).then(browser => {
  console.log('✅ Success! Chromium works.');
  return browser.close();
}).catch(err => {
  console.error('❌ Error:', err.message.split('\n')[0]);
});
EOF

node quick-test.js

echo ""
echo "=== Done ==="
echo ""
echo "If successful, PDF generation should now work."
echo "If not, Replit may need to reload for Nix packages to be available."