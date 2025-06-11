#!/usr/bin/env node

const { generatePDF } = require('./dist/pdf-generator');
const fs = require('fs').promises;
const path = require('path');

// Test markdown content
const testMarkdown = `# Deep Research Test Report

## Executive Summary

This is a test report to validate PDF generation on Replit with Chromium installed via Nix packages.

## Key Findings

1. **Chromium Detection**: Testing if the system can find Chromium in PATH
2. **PDF Generation**: Verifying Puppeteer can launch and create PDFs
3. **Unicode Support**: Testing special characters: €, ™, ©, α, β, π

### Technical Details

- Environment: ${process.env.REPL_ID ? 'Replit' : 'Local'}
- Node Version: ${process.version}
- Platform: ${process.platform}

## Code Example

\`\`\`javascript
async function testPDF() {
  console.log('Generating PDF with Replit Chromium...');
  await generatePDF(markdown, output);
}
\`\`\`

## Conclusion

If you can read this PDF, the Chromium integration is working correctly! 🎉

---
*Generated on ${new Date().toISOString()}*
`;

async function test() {
  console.log('=== Replit PDF Generation Test ===\n');
  
  // Check environment
  console.log('Environment Check:');
  console.log('- REPL_ID:', process.env.REPL_ID || 'Not set');
  console.log('- REPLIT:', process.env.REPLIT || 'Not set');
  console.log('- Platform:', process.platform);
  console.log('- Node:', process.version);
  
  // Check for Chromium
  console.log('\nChromium Check:');
  try {
    const { execSync } = require('child_process');
    const chromiumPath = execSync('which chromium', { encoding: 'utf8' }).trim();
    console.log('- Chromium found at:', chromiumPath);
    
    const chromiumVersion = execSync('chromium --version', { encoding: 'utf8' }).trim();
    console.log('- Version:', chromiumVersion);
  } catch (e) {
    console.log('- Chromium not found in PATH');
  }
  
  // Test PDF generation
  console.log('\nGenerating test PDF...');
  const outputPath = path.join(__dirname, 'test-output.pdf');
  
  try {
    await generatePDF(testMarkdown, outputPath, {
      title: 'Replit Chromium Test Report'
    });
    
    // Check if file was created
    const stats = await fs.stat(outputPath);
    console.log(`\n✅ Success! PDF generated: ${outputPath}`);
    console.log(`   File size: ${stats.size} bytes`);
    console.log('\nYou can now download and view the PDF to verify it rendered correctly.');
    
  } catch (error) {
    console.error('\n❌ Error generating PDF:', error.message);
    console.error('\nFull error:', error);
    
    // Provide troubleshooting tips
    console.log('\nTroubleshooting:');
    console.log('1. Ensure Chromium is in your .replit file: packages = ["chromium"]');
    console.log('2. Try running: nix-channel --update && replit-nix');
    console.log('3. Restart your Repl after adding Chromium');
  }
}

// Ensure dist directory exists
async function ensureDist() {
  try {
    await fs.mkdir(path.join(__dirname, 'dist'), { recursive: true });
  } catch (e) {
    // Directory might already exist
  }
  
  // Compile TypeScript if needed
  console.log('Compiling TypeScript...');
  try {
    const { execSync } = require('child_process');
    execSync('npm run build', { stdio: 'inherit' });
  } catch (e) {
    console.log('Build failed, trying to run test anyway...');
  }
}

// Main execution
(async () => {
  await ensureDist();
  await test();
})().catch(console.error);