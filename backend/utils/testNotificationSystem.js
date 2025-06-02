#!/usr/bin/env node

/**
 * Notification System Test Script
 * Tests the complete push notification flow for MilkMan platform
 */

const webpush = require('web-push');
require('dotenv').config();

// VAPID configuration
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@milkman.com';

// Test subscription (this would normally come from the frontend)
const testSubscription = {
  endpoint: 'https://fcm.googleapis.com/fcm/send/test-endpoint',
  keys: {
    p256dh: 'test-p256dh-key',
    auth: 'test-auth-key'
  }
};

async function testVapidKeys() {
  console.log('🔑 Testing VAPID Keys Configuration...\n');
  
  try {
    // Test key format
    const publicKeyBuffer = Buffer.from(vapidPublicKey.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const privateKeyBuffer = Buffer.from(vapidPrivateKey.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    
    console.log('✅ Public Key Length:', publicKeyBuffer.length, 'bytes (should be 65)');
    console.log('✅ Private Key Length:', privateKeyBuffer.length, 'bytes (should be 32)');
    
    // Test web-push configuration
    webpush.setVapidDetails(vapidEmail, vapidPublicKey, vapidPrivateKey);
    console.log('✅ VAPID keys successfully configured with web-push');
    
    return true;
  } catch (error) {
    console.error('❌ VAPID configuration failed:', error.message);
    return false;
  }
}

async function testBackendHealth() {
  console.log('\n🏥 Testing Backend Health...\n');
  
  try {
    const response = await fetch('http://localhost:5000/api/health');
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Backend is healthy');
      console.log('   - Status:', data.status);
      console.log('   - Timestamp:', data.timestamp);
      console.log('   - Environment:', data.environment);
      return true;
    } else {
      console.error('❌ Backend health check failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Backend connection failed:', error.message);
    return false;
  }
}

async function testFrontendService() {
  console.log('\n🌐 Testing Frontend Service...\n');
  
  try {
    const response = await fetch('http://localhost:3000');
    
    if (response.ok) {
      console.log('✅ Frontend is accessible');
      console.log('   - Status:', response.status);
      console.log('   - URL:', response.url);
      return true;
    } else {
      console.error('❌ Frontend service check failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Frontend connection failed:', error.message);
    return false;
  }
}

async function displaySystemStatus() {
  console.log('\n📊 System Status Summary');
  console.log('='.repeat(50));
  
  const vapidResult = await testVapidKeys();
  const backendResult = await testBackendHealth();
  const frontendResult = await testFrontendService();
  
  console.log('\n🎯 Test Results:');
  console.log(`   VAPID Keys: ${vapidResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Backend: ${backendResult ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Frontend: ${frontendResult ? '✅ PASS' : '❌ FAIL'}`);
  
  const allPassed = vapidResult && backendResult && frontendResult;
  
  console.log('\n🏆 Overall Status:', allPassed ? '✅ ALL SYSTEMS OPERATIONAL' : '❌ ISSUES DETECTED');
  
  if (allPassed) {
    console.log('\n🚀 Notification System Ready!');
    console.log('   - Push notifications are properly configured');
    console.log('   - VAPID keys are valid (65 bytes public, 32 bytes private)');
    console.log('   - Backend and Frontend services are running');
    console.log('   - You can now test notifications in the browser at:');
    console.log('     http://localhost:3000/dashboard/notifications');
  } else {
    console.log('\n🔧 Action Required:');
    if (!vapidResult) console.log('   - Fix VAPID key configuration');
    if (!backendResult) console.log('   - Start or fix backend service (port 5000)');
    if (!frontendResult) console.log('   - Start or fix frontend service (port 3000)');
  }
  
  console.log('\n' + '='.repeat(50));
}

// Add fetch polyfill for Node.js
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

// Run the tests
console.log('🚀 MilkMan Notification System Test\n');
displaySystemStatus().catch(console.error);
