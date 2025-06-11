#!/usr/bin/env node

const puppeteer = require('puppeteer');

async function testPuppeteer() {
  console.log('=== Simple Puppeteer Test for Replit ===\n');
  
  // Check environment
  console.log('Environment:');
  console.log('- Running on Replit:', !!(process.env.REPL_ID || process.env.REPLIT));
  console.log('- Platform:', process.platform);
  console.log('- Node version:', process.version);
  
  // Check for chromium in PATH
  console.log('\nChecking for Chromium...');
  try {
    const { execSync } = require('child_process');
    const chromiumPath = execSync('which chromium', { encoding: 'utf8' }).trim();
    console.log('✅ Chromium found at:', chromiumPath);
    console.log('   Version:', execSync('chromium --version', { encoding: 'utf8' }).trim());
    
    // Test Puppeteer with system Chromium
    console.log('\nLaunching Puppeteer with system Chromium...');
    
    const browser = await puppeteer.launch({
      executablePath: chromiumPath,
      headless: true,
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
    
    const title = await page.evaluate(() => document.querySelector('h1').textContent);
    console.log('✅ Page loaded, content:', title);
    
    await browser.close();
    console.log('✅ Browser closed successfully!');
    
    console.log('\n🎉 Puppeteer is working correctly with Replit Chromium!');
    
  } catch (error) {
    console.error('❌ Chromium not found in PATH or test failed');
    console.error('Error:', error.message);
    
    console.log('\nTrying with Puppeteer\'s bundled Chromium...');
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      console.log('✅ Browser launched with bundled Chromium');
      
      const page = await browser.newPage();
      await page.goto('data:text/html,<h1>Bundled Chromium Works!</h1>');
      
      await browser.close();
      console.log('✅ Bundled Chromium works!');
      
    } catch (error2) {
      console.error('❌ Bundled Chromium also failed:', error2.message);
      console.log('\nTroubleshooting:');
      console.log('1. For Replit: Ensure your .replit file includes packages = ["chromium"]');
      console.log('2. Try running: npm install puppeteer');
      console.log('3. For bundled Chrome: npx puppeteer browsers install chrome');
    }
  }
}

testPuppeteer().catch(console.error);