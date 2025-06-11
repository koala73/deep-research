#!/bin/bash

# Script to install Chrome/Chromium for Puppeteer in various environments

echo "Installing Chrome for Puppeteer..."

# Try to install using Puppeteer's built-in installer
if command -v npx &> /dev/null; then
    echo "Installing Chrome using Puppeteer..."
    npx puppeteer browsers install chrome
    exit 0
fi

# For Debian/Ubuntu systems
if command -v apt-get &> /dev/null; then
    echo "Installing Chromium using apt-get..."
    sudo apt-get update
    sudo apt-get install -y chromium-browser chromium-chromedriver
    exit 0
fi

# For Alpine Linux
if command -v apk &> /dev/null; then
    echo "Installing Chromium using apk..."
    apk add --no-cache chromium chromium-chromedriver
    exit 0
fi

echo "Could not install Chrome automatically. Please install Chrome or Chromium manually."
exit 1