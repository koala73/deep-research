#!/bin/bash

echo "=== Setting up Playwright as Chrome provider ==="
echo ""

# Install playwright-chromium
echo "1. Installing playwright-chromium..."
npm install playwright-chromium

# Create a wrapper module
echo ""
echo "2. Creating Playwright-Puppeteer wrapper..."

cat > playwright-wrapper.js << 'EOF'
// Wrapper to make Playwright work like Puppeteer for PDF generation

const { chromium } = require('playwright-chromium');

class PlaywrightPuppeteerWrapper {
  static async launch(options = {}) {
    const browser = await chromium.launch({
      headless: options.headless !== false,
      args: options.args || []
    });
    
    // Wrap Playwright browser to match Puppeteer API
    const wrappedBrowser = {
      async newPage() {
        const page = await browser.newPage();
        
        // Wrap page methods to match Puppeteer API
        const wrappedPage = {
          ...page,
          async setContent(html, options = {}) {
            await page.setContent(html, {
              waitUntil: options.waitUntil || 'load'
            });
          },
          async pdf(options = {}) {
            return await page.pdf({
              path: options.path,
              format: options.format || 'A4',
              printBackground: options.printBackground !== false,
              margin: options.margin || { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
            });
          }
        };
        
        return wrappedPage;
      },
      
      async close() {
        await browser.close();
      }
    };
    
    return wrappedBrowser;
  }
}

module.exports = PlaywrightPuppeteerWrapper;
EOF

echo "   Created playwright-wrapper.js"

# Create test script
echo ""
echo "3. Testing Playwright..."

cat > test-playwright.js << 'EOF'
const PlaywrightWrapper = require('./playwright-wrapper');

async function test() {
  try {
    console.log('Launching browser with Playwright...');
    
    const browser = await PlaywrightWrapper.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    
    console.log('✅ Browser launched!');
    
    const page = await browser.newPage();
    await page.setContent('<h1>Playwright Works!</h1>');
    
    // Test PDF generation
    await page.pdf({ path: 'test-playwright.pdf' });
    console.log('✅ PDF generated successfully!');
    
    await browser.close();
    
    // Clean up test file
    require('fs').unlinkSync('test-playwright.pdf');
    
    console.log('\n✅ Success! Playwright is working.');
    console.log('\nTo use this in your app:');
    console.log('1. Update pdf-generator.ts to check for playwright-wrapper.js');
    console.log('2. Or create a chrome-config.json with: {"usePlaywright": true}');
    
    // Create config
    require('fs').writeFileSync('chrome-config.json', JSON.stringify({
      usePlaywright: true
    }, null, 2));
    console.log('\nCreated chrome-config.json to use Playwright');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
EOF

node test-playwright.js

echo ""
echo "=== Setup Complete ==="