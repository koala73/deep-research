import * as fs from 'fs/promises';
import * as path from 'path';

let marked: any;
let puppeteer: any;

try {
  marked = require('marked').marked;
  puppeteer = require('puppeteer');
} catch (error) {
  console.error('PDF dependencies not installed. Run: npm install marked puppeteer');
  // Provide stub functions to prevent crashes
  marked = (text: string) => text;
  puppeteer = {
    launch: async () => {
      throw new Error('Puppeteer not installed. Please run: npm install puppeteer');
    }
  };
}

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
  '👍': '+',
  '👎': '-',
  '⭐': '*',
  '🔴': '[RED]',
  '🟢': '[GREEN]',
  '🔵': '[BLUE]',
  '⚪': '[WHITE]',
  '⚫': '[BLACK]',
  '🟡': '[YELLOW]',
  '🟠': '[ORANGE]',
  '🟣': '[PURPLE]',
  '🟤': '[BROWN]',
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
  α: 'alpha',
  β: 'beta',
  γ: 'gamma',
  δ: 'delta',
  π: 'pi',
  Ω: 'omega',
  // Common quotation marks and dashes
  '"': '"',
  '"': '"',
  ''': "'",
  ''': "'",
  '–': '-',
  '—': '--',
  '…': '...',
  '•': '*',
  '‣': '>',
  '․': '.',
  '‥': '..',
  '⁃': '-',
  '※': '*',
  '‼': '!!',
  '⁇': '?!',
  '⁈': '?!',
  '⁉': '!?',
  // Arrows
  '←': '<-',
  '→': '->',
  '↑': '^',
  '↓': 'v',
  '↔': '<->',
  '⇐': '<=',
  '⇒': '=>',
  '⇑': '^^',
  '⇓': 'vv',
  '⇔': '<=>',
  // Fractions
  '¼': '1/4',
  '½': '1/2',
  '¾': '3/4',
  '⅓': '1/3',
  '⅔': '2/3',
  '⅕': '1/5',
  '⅖': '2/5',
  '⅗': '3/5',
  '⅘': '4/5',
  '⅙': '1/6',
  '⅚': '5/6',
  '⅛': '1/8',
  '⅜': '3/8',
  '⅝': '5/8',
  '⅞': '7/8',
  // Other symbols
  '§': 'S',
  '¶': 'P',
  '†': '+',
  '‡': '++',
  '¤': 'o',
  '¦': '|',
  '¨': '"',
  '¬': '-',
  '¯': '-',
  '´': "'",
  '¸': ',',
  'ˆ': '^',
  '˜': '~',
  '‰': 'o/oo',
  '′': "'",
  '″': '"',
  '‴': "'''",
  '‵': '`',
  '‶': '``',
  '‷': '```',
  '‹': '<',
  '›': '>',
  '«': '<<',
  '»': '>>',
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

  // Handle specific problematic characters
  // \x95 is a bullet point in Windows-1252 encoding
  sanitized = sanitized.replace(/\x95/g, '*');
  sanitized = sanitized.replace(/[\x80-\x94]/g, ''); // Remove other Windows-1252 control characters
  sanitized = sanitized.replace(/[\x96-\x9F]/g, ''); // Remove more Windows-1252 control characters
  
  // Replace various bullet points and similar characters
  sanitized = sanitized.replace(/[•·▪▫◦‣⁌⁍]/g, '*');
  
  // Replace various dash characters
  sanitized = sanitized.replace(/[‐‑‒–—―]/g, '-');
  
  // Replace various quotation marks
  sanitized = sanitized.replace(/[''‚‛]/g, "'");
  sanitized = sanitized.replace(/[""„‟]/g, '"');
  
  // Remove zero-width characters
  sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  // Remove high Unicode characters (surrogate pairs)
  sanitized = sanitized.replace(/[\ud800-\udfff]/g, '');
  
  // Remove any remaining non-ASCII characters that might cause issues
  // This is more aggressive but ensures compatibility
  sanitized = sanitized.replace(/[^\x00-\x7F]/g, (char) => {
    // Try to find a replacement first
    const code = char.charCodeAt(0);
    if (code >= 0x00A0 && code <= 0x00FF) {
      // Latin-1 Supplement - these are usually safe
      return char;
    }
    // For everything else, replace with a space or remove
    return ' ';
  });

  // Clean up multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ');

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
    
    @font-face {
      font-family: 'fallback';
      src: local('Arial'), local('Helvetica'), local('sans-serif');
    }
    
    body {
      font-family: 'Inter', Arial, Helvetica, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
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
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ],
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
