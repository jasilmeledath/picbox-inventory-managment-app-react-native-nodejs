#!/bin/bash

# PicBox APK Build Script
# This script prepares and builds the Android APK

echo "🚀 PicBox APK Builder"
echo "===================="
echo ""

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the frontend directory"
    echo "   cd /Users/jasilm/Desktop/picboxfullstack/frontend"
    exit 1
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 EAS CLI not found. Installing..."
    npm install -g eas-cli
    echo "✅ EAS CLI installed"
else
    echo "✅ EAS CLI already installed"
fi

echo ""
echo "📋 Build Options:"
echo "  1) Preview Build (APK for testing)"
echo "  2) Production Build (APK for release)"
echo "  3) Configure EAS only"
echo "  4) Exit"
echo ""
read -p "Select option (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🔨 Building Preview APK..."
        echo "This will take 10-20 minutes"
        echo ""
        eas build --platform android --profile preview
        ;;
    2)
        echo ""
        echo "🔨 Building Production APK..."
        echo "This will take 10-20 minutes"
        echo ""
        eas build --platform android --profile production
        ;;
    3)
        echo ""
        echo "⚙️  Configuring EAS..."
        eas build:configure
        echo ""
        echo "✅ Configuration complete!"
        echo "   Run this script again to build"
        ;;
    4)
        echo "👋 Goodbye!"
        exit 0
        ;;
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "✅ Done!"
echo ""
echo "📱 Download your APK from:"
echo "   https://expo.dev/accounts/[your-account]/projects/picbox-inventory/builds"
echo ""
echo "Or check your email for the download link"
