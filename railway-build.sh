#!/bin/bash
# Railway Build Script - Force Fresh Build

echo "🔨 Starting fresh build..."
echo "📦 Removing old build cache..."

# Remove .next cache
rm -rf .next

# Remove node_modules (optional, uncomment if needed)
# rm -rf node_modules

echo "📥 Installing dependencies..."
npm install

echo "🏗️ Building Next.js application..."
npm run build

echo "✅ Build complete!"
