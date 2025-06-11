const { join } = require('path');
const os = require('os');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Changes the cache location for Puppeteer.
  // Use home directory to avoid permission issues in Replit
  cacheDirectory: process.env.PUPPETEER_CACHE_DIR || join(os.homedir(), '.cache', 'puppeteer'),
  // Download Chrome (default).
  skipDownload: false,
};