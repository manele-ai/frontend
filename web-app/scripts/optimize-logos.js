#!/usr/bin/env node

/**
 * Logo Optimization Script for Google Search
 * This script helps prepare logos for optimal Google search appearance
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Logo Optimization for Google Search\n');

// Check current logo files
const logoFiles = [
  'public/icons/_LOGO_ICON.svg',
  'public/_LOGO_MANELEIO.svg',
  'public/_LOGO_MANELEIO_last.svg',
  'public/favicon.ico'
];

console.log('📁 Current Logo Files:');
logoFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, '..', file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n📱 Required Logo Sizes:');
const requiredSizes = [
  { size: '16x16', purpose: 'Browser favicon' },
  { size: '32x32', purpose: 'Windows taskbar' },
  { size: '180x180', purpose: 'Apple touch icon' },
  { size: '192x192', purpose: 'Android home screen' },
  { size: '512x512', purpose: 'Google search, social media' }
];

requiredSizes.forEach(({ size, purpose }) => {
  console.log(`  📏 ${size} - ${purpose}`);
});