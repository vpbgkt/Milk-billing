const mongoose = require('mongoose');
const User = require('../models/User');
const PlatformSettings = require('../models/PlatformSettings');
require('dotenv').config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const createSuperAdmin = async () => {
  try {
    // Check if SuperAdmin already exists
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    
    if (existingSuperAdmin) {
      console.log('SuperAdmin already exists:', existingSuperAdmin.email);
      return existingSuperAdmin;
    }

    // Create SuperAdmin user
    const superAdminData = {
      name: 'Super Administrator',
      email: process.env.SUPERADMIN_EMAIL || 'admin@milkman.com',
      password: process.env.SUPERADMIN_PASSWORD || 'ChangeThisPassword123!',
      role: 'superadmin',
      isActive: true,
      permissions: ['all']
    };

    const superAdmin = await User.create(superAdminData);
    console.log('SuperAdmin created successfully:', superAdmin.email);
    return superAdmin;
  } catch (error) {
    console.error('Error creating SuperAdmin:', error);
    throw error;
  }
};

const createDefaultSettings = async () => {
  try {
    // Check if settings already exist
    const existingSettings = await PlatformSettings.findOne();
    
    if (existingSettings) {
      console.log('Platform settings already exist');
      return existingSettings;
    }

    // Create default platform settings
    const defaultSettings = {
      platformName: process.env.PLATFORM_NAME || 'MilkMan',
      defaultCommission: parseInt(process.env.DEFAULT_COMMISSION) || 5,
      defaultMilkPrice: parseInt(process.env.DEFAULT_MILK_PRICE) || 60,
      currency: process.env.CURRENCY || 'INR',
      maintenanceMode: false,
      features: {
        enableNotifications: true,
        enableBilling: true,
        enableReports: true,
        enableMobileApp: true
      },
      limits: {
        maxUsersPerSupplier: 100,
        maxMilkEntriesPerDay: 10,
        maxFileUploadSize: 5
      },
      notifications: {
        emailNotifications: true,
        smsNotifications: false,
        whatsappNotifications: true
      },
      branding: {
        logo: '',
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981'
      }
    };

    const settings = await PlatformSettings.create(defaultSettings);
    console.log('Default platform settings created successfully');
    return settings;
  } catch (error) {
    console.error('Error creating default settings:', error);
    throw error;
  }
};

const createSampleSupplier = async () => {
  try {
    // Check if sample supplier already exists
    const existingSupplier = await User.findOne({ 
      role: 'supplier',
      email: 'supplier@milkman.com'
    });
    
    if (existingSupplier) {
      console.log('Sample supplier already exists:', existingSupplier.email);
      return existingSupplier;
    }

    // Create sample supplier
    const supplierData = {
      name: 'Sample Supplier',
      email: 'supplier@milkman.com',
      password: 'supplier123',
      role: 'supplier',
      businessName: 'Fresh Milk Dairy',
      phone: '9876543210',
      address: '123 Dairy Street, Milk City',
      commission: 5,
      isActive: true
    };

    const supplier = await User.create(supplierData);
    console.log('Sample supplier created successfully:', supplier.email);
    return supplier;
  } catch (error) {
    console.error('Error creating sample supplier:', error);
    throw error;
  }
};

const createSampleUser = async (supplierId) => {
  try {
    // Check if sample user already exists
    const existingUser = await User.findOne({ 
      role: 'user',
      email: 'user@milkman.com'
    });
    
    if (existingUser) {
      console.log('Sample user already exists:', existingUser.email);
      return existingUser;
    }

    // Create sample user
    const userData = {
      name: 'Sample User',
      email: 'user@milkman.com',
      password: 'user123',
      role: 'user',
      phone: '9876543211',
      address: '456 User Lane, Milk City',
      supplierId: supplierId,
      isActive: true
    };

    const user = await User.create(userData);
    console.log('Sample user created successfully:', user.email);
    return user;
  } catch (error) {
    console.error('Error creating sample user:', error);
    throw error;
  }
};

const seedDatabase = async () => {
  try {
    console.log('🚀 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Create SuperAdmin
    console.log('\n📝 Creating SuperAdmin...');
    const superAdmin = await createSuperAdmin();
    
    // Create default platform settings
    console.log('\n⚙️  Creating default platform settings...');
    const settings = await createDefaultSettings();
    
    // Create sample supplier
    console.log('\n🏭 Creating sample supplier...');
    const supplier = await createSampleSupplier();
    
    // Create sample user
    console.log('\n👤 Creating sample user...');
    const user = await createSampleUser(supplier._id);
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n🔐 Default Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`SuperAdmin: ${superAdmin.email} / ${process.env.SUPERADMIN_PASSWORD || 'ChangeThisPassword123!'}`);
    console.log(`Supplier: ${supplier.email} / supplier123`);
    console.log(`User: ${user.email} / user123`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  Please change default passwords in production!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n📴 Database connection closed');
    process.exit(0);
  }
};

// Run the seeder
if (require.main === module) {
  seedDatabase();
}

module.exports = {
  createSuperAdmin,
  createDefaultSettings,
  createSampleSupplier,
  createSampleUser,
  seedDatabase
};
