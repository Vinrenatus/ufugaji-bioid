#!/bin/bash

# Ufugaji-BioID Deployment Script
# KSEF 2026 - Livestock Muzzle Print Biometrics System

echo "🚀 Ufugaji-BioID Deployment Script"
echo "=================================="
echo ""

# Navigate to project directory
cd "$(dirname "$0")"

echo "📦 Step 1: Installing dependencies..."
npm install

echo ""
echo "🔨 Step 2: Building production bundle..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""
echo "📁 Production files are in: ./dist"
echo ""
echo "🌐 Deploy to Netlify:"
echo "===================="
echo ""
echo "Option 1: Via Netlify Website (Recommended)"
echo "  1. Go to: https://app.netlify.com/sites/ksefufugajibioid/deploys"
echo "  2. Click 'Trigger deploy'"
echo "  3. Select 'Deploy site'"
echo "  4. Wait for build to complete (~2 minutes)"
echo ""
echo "Option 2: Via Netlify Drop"
echo "  1. Go to: https://app.netlify.com/drop"
echo "  2. Drag and drop the 'dist' folder"
echo ""
echo "Option 3: Via Netlify CLI (if authenticated)"
echo "  netlify deploy --prod"
echo ""
echo "📊 GitHub Repository:"
echo "  https://github.com/Vinrenatus/ufugaji-bioid"
echo ""
echo "🌍 Live Site:"
echo "  https://ksefufugajibioid.netlify.app"
echo ""
echo "=================================="
echo "✨ Features in this version:"
echo "  ✅ Cow-muzzle specific AI validation"
echo "  ✅ Image upload fallback (when camera unavailable)"
echo "  ✅ 28-dimensional feature extraction"
echo "  ✅ Offline-first architecture"
echo "  ✅ PDF certificate generation"
echo "=================================="
echo ""
