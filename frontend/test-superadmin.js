// Simple test to verify the SuperAdminService exports correctly
try {
  const { superAdminService } = require('./src/services/superadmin.ts');
  console.log('✅ SuperAdminService imported successfully');
  console.log('Methods available:', Object.getOwnPropertyNames(Object.getPrototypeOf(superAdminService)));
} catch (error) {
  console.error('❌ Failed to import SuperAdminService:', error.message);
}
