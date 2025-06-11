import * as fs from 'fs/promises';
import * as path from 'path';
import { marked } from 'marked';
import puppeteer from 'puppeteer';

export interface PDFConfig {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  title: string;
  headerFontSize: number;
  titleFontSize: number;
  itemFontSize: number;
  footerFontSize: number;
  pageBreakThreshold: number;
}

const defaultConfig: PDFConfig = {
  pageWidth: 210,
  pageHeight: 297,
  margin: 20,
  title: 'Deep Research Report',
  headerFontSize: 24,
  titleFontSize: 18,
  itemFontSize: 12,
  footerFontSize: 10,
  pageBreakThreshold: 0.85,
};

const emojiReplacements: Record<string, string> = {
  '📄': 'PDF',
  '🔍': 'Search',
  '🤖': 'Robot',
  '📊': 'Chart',
  '💡': 'Idea',
  '🌐': 'Web',
  '🔗': 'Link',
  '📈': 'Growth',
  '🎯': 'Target',
  '⚡': 'Lightning',
  '🚀': 'Rocket',
  '💻': 'Computer',
  '📱': 'Mobile',
  '🔒': 'Lock',
  '🔓': 'Unlock',
  '✅': 'Check',
  '❌': 'X',
  '⚠️': 'Warning',
  '💬': 'Comment',
  '📝': 'Note',
};

const specialCharReplacements: Record<string, string> = {
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'YEN',
  '₹': 'INR',
  '©': '(c)',
  '®': '(R)',
  '™': '(TM)',
  '°': 'deg',
  '±': '+/-',
  '×': 'x',
  '÷': '/',
  '≤': '<=',
  '≥': '>=',
  '≠': '!=',
  '≈': '~=',
  '∞': 'infinity',
  '√': 'sqrt',
  '∑': 'sum',
  '∏': 'product',
  'α': 'alpha',
  'β': 'beta',
  'γ': 'gamma',
  'δ': 'delta',
  'π': 'pi',
  'Ω': 'omega',
};

function sanitizeText(text: string): string {
  // Replace emojis
  let sanitized = text;
  for (const [emoji, replacement] of Object.entries(emojiReplacements)) {
    sanitized = sanitized.replace(new RegExp(emoji, 'g'), replacement);
  }

  // Replace special characters
  for (const [char, replacement] of Object.entries(specialCharReplacements)) {
    sanitized = sanitized.replace(new RegExp(char, 'g'), replacement);
  }

  // Remove high Unicode characters (surrogate pairs)
  sanitized = sanitized.replace(/[\ud800-\udfff]/g, '');

  // Ensure UTF-8 encoding
  sanitized = Buffer.from(sanitized, 'utf-8').toString('utf-8');

  return sanitized;
}

function generateCSS(config: PDFConfig): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: ${config.itemFontSize}pt;
      line-height: 1.6;
      color: #2d3748;
      background: white;
      padding: ${config.margin}mm;
    }
    
    .report-header {
      text-align: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid #4a5568;
    }
    
    .report-title {
      font-size: ${config.headerFontSize}pt;
      font-weight: 700;
      color: #1a202c;
      margin-bottom: 10px;
    }
    
    .report-date {
      font-size: ${config.footerFontSize}pt;
      color: #718096;
    }
    
    h1 {
      font-size: ${config.titleFontSize}pt;
      font-weight: 700;
      color: #2563eb;
      margin: 30px 0 15px 0;
      page-break-after: avoid;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 8px;
    }
    
    h2 {
      font-size: ${config.titleFontSize - 2}pt;
      font-weight: 600;
      color: #3730a3;
      margin: 25px 0 12px 0;
      page-break-after: avoid;
    }
    
    h3 {
      font-size: ${config.titleFontSize - 4}pt;
      font-weight: 600;
      color: #4c1d95;
      margin: 20px 0 10px 0;
      page-break-after: avoid;
    }
    
    p {
      margin: 0 0 12px 0;
      text-align: justify;
    }
    
    ul, ol {
      margin: 0 0 12px 20px;
      padding-left: 20px;
    }
    
    li {
      margin-bottom: 6px;
    }
    
    code {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 3px;
      padding: 2px 6px;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 0.9em;
      color: #e53e3e;
    }
    
    pre {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 16px;
      overflow-x: auto;
      margin: 0 0 12px 0;
      page-break-inside: avoid;
    }
    
    pre code {
      background: none;
      border: none;
      padding: 0;
      color: #2d3748;
    }
    
    blockquote {
      border-left: 4px solid #4a5568;
      padding-left: 16px;
      margin: 0 0 12px 0;
      color: #4a5568;
      font-style: italic;
    }
    
    a {
      color: #2563eb;
      text-decoration: none;
      border-bottom: 1px solid #93c5fd;
      transition: all 0.2s;
    }
    
    a:hover {
      color: #1d4ed8;
      border-bottom-color: #1d4ed8;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 0 0 12px 0;
      page-break-inside: avoid;
    }
    
    th, td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
    }
    
    th {
      background: #f7fafc;
      font-weight: 600;
      color: #1a202c;
    }
    
    tr:nth-child(even) {
      background: #f9fafb;
    }
    
    .page-break {
      page-break-after: always;
    }
    
    .footer {
      position: fixed;
      bottom: ${config.margin}mm;
      left: ${config.margin}mm;
      right: ${config.margin}mm;
      text-align: center;
      font-size: ${config.footerFontSize}pt;
      color: #718096;
      padding-top: 10px;
      border-top: 1px solid #e2e8f0;
    }
    
    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
    
    .sources-section {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e2e8f0;
    }
    
    .source-item {
      margin-bottom: 8px;
      padding-left: 20px;
      text-indent: -20px;
      word-break: break-word;
    }
    
    .source-number {
      color: #4a5568;
      font-weight: 600;
    }
  `;
}

function generateHTML(markdownContent: string, config: PDFConfig): string {
  const sanitizedContent = sanitizeText(markdownContent);
  const htmlContent = marked(sanitizedContent);
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${config.title}</title>
  <style>
    ${generateCSS(config)}
  </style>
</head>
<body>
  <div class="report-header">
    <h1 class="report-title">${config.title}</h1>
    <div class="report-date">Generated on ${currentDate}</div>
  </div>
  
  <div class="content">
    ${htmlContent}
  </div>
  
  <div class="footer">
    Page <span class="page-number"></span>
  </div>
</body>
</html>
  `;
}

export async function generatePDF(
  markdownContent: string,
  outputPath: string,
  config: Partial<PDFConfig> = {},
): Promise<void> {
  const fullConfig = { ...defaultConfig, ...config };
  
  // Generate HTML from markdown
  const html = generateHTML(markdownContent, fullConfig);
  
  // Save HTML temporarily for debugging (optional)
  const tempHtmlPath = outputPath.replace('.pdf', '.html');
  await fs.writeFile(tempHtmlPath, html, 'utf-8');
  
  // Launch Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    
    // Set content
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });
    
    // Generate PDF
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: false,
      margin: {
        top: `${fullConfig.margin}mm`,
        right: `${fullConfig.margin}mm`,
        bottom: `${fullConfig.margin}mm`,
        left: `${fullConfig.margin}mm`,
      },
    });
    
    // Clean up temporary HTML file
    await fs.unlink(tempHtmlPath).catch(() => {});
    
  } finally {
    await browser.close();
  }
}

export async function generatePDFFromFile(
  markdownPath: string,
  outputPath: string,
  config: Partial<PDFConfig> = {},
): Promise<void> {
  const markdownContent = await fs.readFile(markdownPath, 'utf-8');
  await generatePDF(markdownContent, outputPath, config);
}