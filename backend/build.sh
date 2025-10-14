#!/usr/bin/env bash
# exit on error
set -o errexit

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Install Chromium for Puppeteer
echo "🌐 Installing Chromium for Puppeteer..."
npx puppeteer browsers install chrome

echo "✅ Build completed successfully"
