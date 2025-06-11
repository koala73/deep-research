#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('=== PDF Generation Test Script ===\n');

// Step 1: Check current directory
console.log('1. Current directory:', process.cwd());

// Step 2: Check Puppeteer cache locations
console.log('\n2. Checking Puppeteer cache locations:');
const possibleCachePaths = [
  '/home/runner/.cache/puppeteer',
  '/home/runner/workspace/.cache/puppeteer',
  './.cache/puppeteer',
  './node_modules/puppeteer/.local-chromium',
  process.env.PUPPETEER_CACHE_DIR
].filter(Boolean);

possibleCachePaths.forEach(cachePath => {
  console.log(`   Checking ${cachePath}:`, fs.existsSync(cachePath) ? 'EXISTS' : 'NOT FOUND');
  if (fs.existsSync(cachePath)) {
    try {
      const contents = fs.readdirSync(cachePath);
      console.log(`     Contents:`, contents.join(', '));
    } catch (e) {
      console.log(`     Error reading:`, e.message);
    }
  }
});

// Step 3: Check system Chrome installations
console.log('\n3. Checking system Chrome/Chromium:');
const systemPaths = [
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/snap/bin/chromium',
  '/opt/google/chrome/chrome'
];

systemPaths.forEach(chromePath => {
  console.log(`   ${chromePath}:`, fs.existsSync(chromePath) ? 'FOUND' : 'NOT FOUND');
});

// Step 4: Check environment variables
console.log('\n4. Environment variables:');
console.log('   PUPPETEER_CACHE_DIR:', process.env.PUPPETEER_CACHE_DIR || 'NOT SET');
console.log('   PUPPETEER_EXECUTABLE_PATH:', process.env.PUPPETEER_EXECUTABLE_PATH || 'NOT SET');
console.log('   PUPPETEER_SKIP_CHROMIUM_DOWNLOAD:', process.env.PUPPETEER_SKIP_CHROMIUM_DOWNLOAD || 'NOT SET');

// Step 5: Try to install Chrome
console.log('\n5. Installing Chrome for Puppeteer...');
try {
  execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
  console.log('   Chrome installation completed!');
} catch (e) {
  console.log('   Error installing Chrome:', e.message);
}

// Step 6: Check Puppeteer configuration
console.log('\n6. Checking Puppeteer configuration:');
const puppeteerConfigPath = path.join(process.cwd(), '.puppeteerrc.cjs');
console.log('   .puppeteerrc.cjs exists:', fs.existsSync(puppeteerConfigPath));

// Step 7: Try to get Puppeteer executable path
console.log('\n7. Testing Puppeteer executable path:');
try {
  const puppeteer = require('puppeteer');
  const execPath = puppeteer.executablePath();
  console.log('   Puppeteer executable path:', execPath);
  console.log('   Executable exists:', fs.existsSync(execPath));
} catch (e) {
  console.log('   Error getting executable path:', e.message);
}

// Step 8: Test PDF generation
console.log('\n8. Testing PDF generation:');
const testPdfGeneration = async () => {
  try {
    const { generatePDF } = require('./src/pdf-generator');
    const testMarkdown = `# Test PDF Report

## Introduction
This is a test PDF generation to verify Chrome/Puppeteer setup.

### Features Tested
- Unicode characters: €, £, ¥
- Emojis: 🚀 🎯 ✅
- Special characters: • → ≥ ≤

## Conclusion
If you can read this, PDF generation is working!
`;
    
    await generatePDF(testMarkdown, './test-output.pdf', { title: 'Test PDF Report' });
    console.log('   ✅ PDF generated successfully! Check test-output.pdf');
  } catch (error) {
    console.log('   ❌ PDF generation failed:', error.message);
  }
};

// Run the test
testPdfGeneration().then(() => {
  console.log('\n=== Test Complete ===');
}).catch(console.error);