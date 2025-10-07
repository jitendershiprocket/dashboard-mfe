#!/usr/bin/env node

/**
 * Bundle Optimization Script for S3 Deployment
 * 
 * This script optimizes the production build for custom element usage:
 * - Renames files to consistent names (no hashes) for easier integration
 * - Adds gzip compression for faster S3 downloads
 * - Generates integration snippet
 * - Creates manifest file
 * - Reports bundle size statistics
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const DIST_DIR = path.join(__dirname, '../dist/dashboard-mfe/browser');
const OUTPUT_DIR = path.join(__dirname, '../dist/optimized');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function gzipFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);
    const gzip = zlib.createGzip({ level: 9 });
    
    input.pipe(gzip).pipe(output);
    output.on('finish', resolve);
    output.on('error', reject);
  });
}

async function optimizeBundle() {
  log('\n🚀 Starting Bundle Optimization for S3 Deployment\n', 'cyan');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Find and rename files
  const files = fs.readdirSync(DIST_DIR);
  const fileMap = {};
  const stats = { original: 0, gzipped: 0 };

  for (const file of files) {
    const filePath = path.join(DIST_DIR, file);
    const fileStat = fs.statSync(filePath);
    
    if (fileStat.isFile()) {
      let newName = file;
      
      // Rename hashed files to simple names
      if (file.match(/main-.*\.js$/)) {
        newName = 'dashboard-mfe.js';
      } else if (file.match(/polyfills-.*\.js$/)) {
        newName = 'polyfills.js';
      } else if (file.match(/styles-.*\.css$/)) {
        newName = 'styles.css';
      }
      
      const outputPath = path.join(OUTPUT_DIR, newName);
      
      // Copy file
      fs.copyFileSync(filePath, outputPath);
      fileMap[newName] = {
        original: file,
        size: fileStat.size
      };
      stats.original += fileStat.size;
      
      // Create gzipped version
      const gzipPath = outputPath + '.gz';
      await gzipFile(filePath, gzipPath);
      const gzipSize = fs.statSync(gzipPath).size;
      fileMap[newName].gzipSize = gzipSize;
      stats.gzipped += gzipSize;
      
      log(`✓ ${newName.padEnd(25)} ${formatBytes(fileStat.size).padEnd(12)} → ${formatBytes(gzipSize)} (gzipped)`, 'green');
    }
  }

  // Copy index.html
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    fs.copyFileSync(indexPath, path.join(OUTPUT_DIR, 'index.html'));
    log('✓ index.html copied', 'green');
  }

  // Generate integration snippet
  const snippet = generateIntegrationSnippet();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'integration-snippet.html'), snippet);
  log('✓ integration-snippet.html generated', 'green');

  // Generate manifest
  const manifest = {
    version: '1.0.0',
    buildDate: new Date().toISOString(),
    files: fileMap,
    totalSize: {
      original: stats.original,
      gzipped: stats.gzipped,
      compression: Math.round((1 - stats.gzipped / stats.original) * 100)
    }
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  log('✓ manifest.json generated', 'green');

  // Print summary
  log('\n📊 Bundle Size Summary\n', 'cyan');
  log(`Original:    ${formatBytes(stats.original)}`, 'yellow');
  log(`Gzipped:     ${formatBytes(stats.gzipped)}`, 'yellow');
  log(`Compression: ${manifest.totalSize.compression}%`, 'yellow');
  log(`\n✅ Optimization complete! Files are in: dist/optimized/\n`, 'green');
  
  log('📦 Upload to S3:', 'blue');
  log('   aws s3 sync dist/optimized/ s3://your-bucket/dashboard-mfe/ --exclude "*.gz" --cache-control "max-age=31536000"', 'cyan');
  log('\n📝 Integration snippet saved to: dist/optimized/integration-snippet.html\n', 'blue');
}

function generateIntegrationSnippet() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard MFE Integration</title>
  
  <!-- Dashboard MFE Styles -->
  <link rel="stylesheet" href="https://your-cdn.s3.amazonaws.com/dashboard-mfe/styles.css">
</head>
<body>
  <!-- Dashboard MFE Custom Element -->
  <dashboard-mfe-root></dashboard-mfe-root>

  <!-- Load Scripts -->
  <script src="https://your-cdn.s3.amazonaws.com/dashboard-mfe/polyfills.js" defer></script>
  <script src="https://your-cdn.s3.amazonaws.com/dashboard-mfe/dashboard-mfe.js" defer></script>

  <!-- Optional: Listen for ready event -->
  <script>
    window.addEventListener('dashboard-mfe-ready', function() {
      console.log('Dashboard MFE is ready!');
    });
  </script>
</body>
</html>

<!-- 
  Integration Instructions:
  
  1. Replace 'your-cdn.s3.amazonaws.com' with your actual S3 bucket URL
  
  2. For integration in SR_Web (or any Angular app):
     - Add the scripts to index.html OR load dynamically
     - Use <dashboard-mfe-root></dashboard-mfe-root> in your template
     
  3. Dynamic Loading Example:
     
     loadDashboardMFE() {
       // Load styles
       const link = document.createElement('link');
       link.rel = 'stylesheet';
       link.href = 'https://your-cdn.s3.amazonaws.com/dashboard-mfe/styles.css';
       document.head.appendChild(link);
       
       // Load polyfills
       const polyfills = document.createElement('script');
       polyfills.src = 'https://your-cdn.s3.amazonaws.com/dashboard-mfe/polyfills.js';
       polyfills.defer = true;
       document.head.appendChild(polyfills);
       
       // Load main bundle
       const main = document.createElement('script');
       main.src = 'https://your-cdn.s3.amazonaws.com/dashboard-mfe/dashboard-mfe.js';
       main.defer = true;
       document.head.appendChild(main);
       
       // Wait for ready
       window.addEventListener('dashboard-mfe-ready', () => {
         console.log('Dashboard MFE loaded and ready!');
       });
     }
-->`;
}

// Run optimization
optimizeBundle().catch(err => {
  console.error('❌ Optimization failed:', err);
  process.exit(1);
});

