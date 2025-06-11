#!/usr/bin/env node

// Use tsx to run TypeScript directly
const { execSync } = require('child_process');
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

// Create a TypeScript test file and run it with tsx
async function runTest() {
  // Create TypeScript test file
  const tsTestFile = path.join(__dirname, 'test-replit-pdf.ts');
  
  const tsContent = `
import { generatePDF } from './src/pdf-generator';
import * as fs from 'fs/promises';
import * as path from 'path';

const testMarkdown = \`${testMarkdown.replace(/`/g, '\\`')}\`;

async function test() {
  console.log('=== Replit PDF Generation Test ===\\n');
  
  // Check environment
  console.log('Environment Check:');
  console.log('- REPL_ID:', process.env.REPL_ID || 'Not set');
  console.log('- REPLIT:', process.env.REPLIT || 'Not set');
  console.log('- Platform:', process.platform);
  console.log('- Node:', process.version);
  
  // Check for Chromium
  console.log('\\nChromium Check:');
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
  console.log('\\nGenerating test PDF...');
  const outputPath = path.join(__dirname, 'test-output.pdf');
  
  try {
    await generatePDF(testMarkdown, outputPath, {
      title: 'Replit Chromium Test Report'
    });
    
    // Check if file was created
    const stats = await fs.stat(outputPath);
    console.log(\`\\n✅ Success! PDF generated: \${outputPath}\`);
    console.log(\`   File size: \${stats.size} bytes\`);
    console.log('\\nYou can now download and view the PDF to verify it rendered correctly.');
    
  } catch (error: any) {
    console.error('\\n❌ Error generating PDF:', error.message);
    console.error('\\nFull error:', error);
    
    // Provide troubleshooting tips
    console.log('\\nTroubleshooting:');
    console.log('1. Ensure Chromium is in your .replit file: packages = ["chromium"]');
    console.log('2. Try running: nix-channel --update && replit-nix');
    console.log('3. Restart your Repl after adding Chromium');
  }
}

test().catch(console.error);
`;

  await fs.writeFile(tsTestFile, tsContent);
  
  console.log('Running test with tsx...\n');
  try {
    execSync('npm run tsx test-replit-pdf.ts', { stdio: 'inherit' });
  } catch (e) {
    // Error already displayed
  }
  
  // Clean up
  await fs.unlink(tsTestFile).catch(() => {});
}

// Main execution
runTest().catch(console.error);