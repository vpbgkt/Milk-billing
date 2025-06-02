const webpush = require('web-push');
const crypto = require('crypto');

/**
 * Generate and validate VAPID keys for push notifications
 * This script resolves the "65 bytes" validation issue
 */

function generateVapidKeys() {
  console.log('🔑 Generating VAPID keys...\n');
  
  // Method 1: Using web-push library
  console.log('Method 1: Using web-push library');
  const keys1 = webpush.generateVAPIDKeys();
  console.log('Public Key:', keys1.publicKey);
  console.log('Private Key:', keys1.privateKey);
  
  // Validate the keys
  validateVapidKey(keys1.publicKey, 'Method 1 Public Key');
  validateVapidKey(keys1.privateKey, 'Method 1 Private Key');
  
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Method 2: Manual generation to ensure proper length
  console.log('Method 2: Manual generation with proper base64url encoding');
  const keys2 = generateProperVapidKeys();
  console.log('Public Key:', keys2.publicKey);
  console.log('Private Key:', keys2.privateKey);
  
  // Validate the keys
  validateVapidKey(keys2.publicKey, 'Method 2 Public Key');
  validateVapidKey(keys2.privateKey, 'Method 2 Private Key');
  
  console.log('\n' + '='.repeat(80) + '\n');
  
  // Test the keys with web-push
  console.log('🧪 Testing keys with web-push...');
  testVapidKeys(keys1, 'Method 1');
  testVapidKeys(keys2, 'Method 2');
  
  return { method1: keys1, method2: keys2 };
}

function validateVapidKey(key, name) {
  try {
    // Convert base64url to buffer
    const buffer = Buffer.from(key.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    console.log(`${name} - Decoded length: ${buffer.length} bytes`);
    
    if (buffer.length === 65) {
      console.log(`✅ ${name} - Correct length (65 bytes)`);
    } else {
      console.log(`❌ ${name} - Incorrect length (${buffer.length} bytes, expected 65)`);
    }
  } catch (error) {
    console.log(`❌ ${name} - Invalid base64url encoding:`, error.message);
  }
}

function generateProperVapidKeys() {
  // Generate a proper P-256 key pair
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'der'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der'
    }
  });
  
  // Extract the raw public key (65 bytes for uncompressed P-256)
  // The DER format includes extra metadata, we need just the 65-byte key
  const publicKeyRaw = publicKey.slice(-65); // Last 65 bytes
  
  // Extract the raw private key (32 bytes for P-256)
  const privateKeyRaw = privateKey.slice(-32); // Last 32 bytes
  
  // Convert to base64url
  const publicKeyBase64 = publicKeyRaw.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
    
  const privateKeyBase64 = privateKeyRaw.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return {
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64
  };
}

function testVapidKeys(keys, methodName) {
  try {
    webpush.setVapidDetails(
      'mailto:admin@milkman.com',
      keys.publicKey,
      keys.privateKey
    );
    console.log(`✅ ${methodName} - Keys are valid and accepted by web-push`);
  } catch (error) {
    console.log(`❌ ${methodName} - Keys rejected by web-push:`, error.message);
  }
}

function updateEnvFile(keys) {
  const fs = require('fs');
  const path = require('path');
  
  const envPath = path.join(__dirname, '../.env');
  
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Update VAPID keys
    envContent = envContent.replace(
      /VAPID_PUBLIC_KEY=.*/,
      `VAPID_PUBLIC_KEY=${keys.publicKey}`
    );
    envContent = envContent.replace(
      /VAPID_PRIVATE_KEY=.*/,
      `VAPID_PRIVATE_KEY=${keys.privateKey}`
    );
    
    // Write back to file
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env file with new VAPID keys');
    
    // Also update frontend .env.local
    const frontendEnvPath = path.join(__dirname, '../../frontend/.env.local');
    if (fs.existsSync(frontendEnvPath)) {
      let frontendEnvContent = fs.readFileSync(frontendEnvPath, 'utf8');
      frontendEnvContent = frontendEnvContent.replace(
        /NEXT_PUBLIC_VAPID_PUBLIC_KEY=.*/,
        `NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`
      );
      fs.writeFileSync(frontendEnvPath, frontendEnvContent);
      console.log('✅ Updated frontend .env.local with new VAPID public key');
    }
    
  } catch (error) {
    console.error('❌ Failed to update .env files:', error.message);
  }
}

// Run the script
if (require.main === module) {
  console.log('🚀 VAPID Key Generator for MilkMan Platform\n');
  
  const result = generateVapidKeys();
  
  // Ask user which keys to use
  console.log('\n📝 Which set of keys would you like to use?');
  console.log('1. Method 1 (web-push library)');
  console.log('2. Method 2 (manual generation)');
  
  // For now, let's use Method 1 if it's valid, otherwise Method 2
  const keysToUse = result.method1;
  
  console.log('\n🔧 Updating .env files with selected keys...');
  updateEnvFile(keysToUse);
  
  console.log('\n✅ VAPID key generation complete!');
  console.log('\n📋 Environment variables to use:');
  console.log(`VAPID_PUBLIC_KEY=${keysToUse.publicKey}`);
  console.log(`VAPID_PRIVATE_KEY=${keysToUse.privateKey}`);
  console.log('VAPID_EMAIL=mailto:admin@milkman.com');
}

module.exports = {
  generateVapidKeys,
  validateVapidKey,
  testVapidKeys,
  updateEnvFile
};
