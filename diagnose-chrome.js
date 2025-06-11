const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== Chrome/Puppeteer Diagnostics ===\n');

// 1. Environment info
console.log('1. Environment:');
console.log('   HOME:', process.env.HOME);
console.log('   PWD:', process.cwd());
console.log('   NODE_VERSION:', process.version);
console.log('   PUPPETEER_CACHE_DIR:', process.env.PUPPETEER_CACHE_DIR || 'NOT SET');

// 2. Check if puppeteer is installed
console.log('\n2. Puppeteer installation:');
try {
  const puppeteer = require('puppeteer');
  console.log('   ✓ Puppeteer is installed');
  
  // Get browser info
  const browser = puppeteer.createBrowserFetcher();
  const revisionInfo = browser.revisionInfo(browser.defaultDownloadHost);
  console.log('   Expected revision:', revisionInfo.revision);
  
  // Check executable path
  try {
    const execPath = puppeteer.executablePath();
    console.log('   Executable path:', execPath);
    console.log('   Executable exists:', fs.existsSync(execPath));
  } catch (e) {
    console.log('   ✗ Error getting executable path:', e.message);
  }
} catch (e) {
  console.log('   ✗ Puppeteer not installed');
}

// 3. Find all Chrome installations
console.log('\n3. Chrome installations found:');
const searchPaths = [
  process.env.HOME && path.join(process.env.HOME, '.cache/puppeteer'),
  '/home/runner/.cache/puppeteer',
  '/home/runner/workspace/.cache/puppeteer',
  './node_modules/puppeteer/.local-chromium',
  './.cache/puppeteer',
];

searchPaths.forEach(searchPath => {
  if (searchPath && fs.existsSync(searchPath)) {
    console.log(`\n   ${searchPath}:`);
    findChromeInPath(searchPath, '     ');
  }
});

function findChromeInPath(dir, indent = '') {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (file.includes('chrome') || file.includes('linux')) {
          console.log(`${indent}📁 ${file}/`);
          findChromeInPath(fullPath, indent + '  ');
        }
      } else if (file === 'chrome' || file === 'chromium') {
        console.log(`${indent}✓ ${file} (${stat.size} bytes)`);
      }
    });
  } catch (e) {
    console.log(`${indent}Error reading: ${e.message}`);
  }
}

// 4. Try to install Chrome
console.log('\n4. Attempting to install Chrome:');
try {
  console.log('   Running: npx puppeteer browsers install chrome');
  execSync('npx puppeteer browsers install chrome', { stdio: 'inherit' });
  console.log('   ✓ Installation completed');
} catch (e) {
  console.log('   ✗ Installation failed:', e.message);
}

// 5. Final check
console.log('\n5. Final verification:');
try {
  const puppeteer = require('puppeteer');
  const execPath = puppeteer.executablePath();
  if (fs.existsSync(execPath)) {
    console.log('   ✓ Chrome is ready at:', execPath);
  } else {
    console.log('   ✗ Chrome still not found');
    console.log('   You may need to run: ./install-puppeteer-replit.sh');
  }
} catch (e) {
  console.log('   ✗ Error:', e.message);
}

console.log('\n=== End of Diagnostics ===');