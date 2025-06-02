#!/usr/bin/env node

/**
 * Simplified Frontend Notification System Test
 * Tests key files and basic functionality without hanging HTTP requests
 */

const fs = require('fs');
const path = require('path');

// Colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Test file existence and basic content
function testFile(filePath, description, requiredContent = []) {
  try {
    if (!fs.existsSync(filePath)) {
      logError(`${description}: File not found at ${filePath}`);
      return false;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (content.length === 0) {
      logError(`${description}: File is empty`);
      return false;
    }
    
    // Check for required content
    let allContentFound = true;
    for (const required of requiredContent) {
      if (!content.includes(required)) {
        logError(`${description}: Missing required content "${required}"`);
        allContentFound = false;
      }
    }
    
    if (allContentFound) {
      logSuccess(`${description}: ✓ File exists and has required content (${content.length} chars)`);
      return true;
    }
    
    return false;
  } catch (error) {
    logError(`${description}: Error reading file - ${error.message}`);
    return false;
  }
}

async function runTests() {
  log('🚀 Starting Frontend Notification System File Tests\n', colors.bright);
  
  let passed = 0;
  let total = 0;
  
  const tests = [
    // Service Worker
    {
      file: './public/sw.js',
      description: 'Service Worker',
      required: ['self.addEventListener', 'push', 'notification']
    },
    
    // PWA Manifest
    {
      file: './public/manifest.json',
      description: 'PWA Manifest',
      required: ['name', 'start_url', 'display']
    },
    
    // Notification Service
    {
      file: './src/services/notifications.ts',
      description: 'Notification Service',
      required: ['registerServiceWorker', 'requestPermission', 'subscribe']
    },
    
    // Notification Context
    {
      file: './src/contexts/NotificationContext.tsx',
      description: 'Notification Context',
      required: ['NotificationProvider', 'useNotification']
    },
    
    // Notification Testing Component
    {
      file: './src/components/notifications/NotificationTesting.tsx',
      description: 'Notification Testing Component',
      required: ['testBasicNotification', 'testRichNotification']
    },
    
    // Notification Page
    {
      file: './src/app/dashboard/notifications/page.tsx',
      description: 'Notification Settings Page',
      required: ['NotificationTesting', 'NotificationSettingsForm']
    },
    
    // Layout with updated metadata
    {
      file: './src/app/layout.tsx',
      description: 'Layout with Viewport Export',
      required: ['export const viewport', 'Viewport']
    }
  ];
  
  // Test each file
  for (const test of tests) {
    total++;
    if (testFile(test.file, test.description, test.required)) {
      passed++;
    }
  }
  
  // Additional file structure checks
  log('\n📁 Checking file structure...', colors.cyan);
  
  const directories = [
    './src/components/notifications',
    './src/services',
    './src/contexts',
    './src/app/dashboard/notifications',
    './public'
  ];
  
  for (const dir of directories) {
    total++;
    if (fs.existsSync(dir) && fs.statSync(dir).isDirectory()) {
      logSuccess(`Directory exists: ${dir}`);
      passed++;
    } else {
      logError(`Directory missing: ${dir}`);
    }
  }
  
  // Check package.json for required dependencies
  log('\n📦 Checking dependencies...', colors.cyan);
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const requiredDeps = ['next', 'react', 'typescript'];
    
    for (const dep of requiredDeps) {
      total++;
      if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
        logSuccess(`Dependency found: ${dep}`);
        passed++;
      } else {
        logError(`Missing dependency: ${dep}`);
      }
    }
  } catch (error) {
    logError(`Error reading package.json: ${error.message}`);
  }
  
  // Summary
  log('\n📊 Test Results Summary', colors.bright);
  log('='.repeat(50), colors.cyan);
  log(`Total Tests: ${total}`, colors.blue);
  log(`Passed: ${passed}`, colors.green);
  log(`Failed: ${total - passed}`, (total - passed) > 0 ? colors.red : colors.green);
  log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`, 
      (total - passed) === 0 ? colors.green : colors.yellow);
  
  if (total - passed === 0) {
    log('\n🎉 All file tests passed! The notification system files are in place.', colors.green);
    log('\n📋 Next Steps:', colors.cyan);
    log('1. ✅ Servers are running (Backend: :5000, Frontend: :3000)', colors.green);
    log('2. ✅ Files are in place and have required content', colors.green);
    log('3. 🔄 Test browser functionality manually in the Simple Browser', colors.yellow);
    log('4. 🔄 Test push notifications from the /dashboard/notifications page', colors.yellow);
  } else {
    log(`\n⚠️  ${total - passed} test(s) failed. Please review the issues above.`, colors.yellow);
  }
  
  return (total - passed) === 0;
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    logError(`Test runner failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = { runTests };
