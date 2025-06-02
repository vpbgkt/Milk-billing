const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const testUsers = [
  {
    name: 'Super Admin',
    email: 'admin@milkman.com',
    password: 'admin123',
    phone: '9999999999',
    role: 'superadmin',
    address: 'Admin Office, City Center',
    permissions: ['all']
  },
  {
    name: 'Raj Dairy Farm',
    email: 'raj@supplier.com',
    password: 'supplier123',
    phone: '9876543210',
    role: 'supplier',
    address: 'Village Dairy Farm, Rural Area',
    businessName: 'Raj Dairy Farm',
    businessType: 'dairy_farm',
    permissions: ['manage_users', 'generate_bills', 'view_analytics']
  },
  {
    name: 'Fresh Milk Distributors',
    email: 'fresh@supplier.com',
    password: 'supplier123',
    phone: '9876543211',
    role: 'supplier',
    address: 'Distribution Center, City',
    businessName: 'Fresh Milk Distributors',
    businessType: 'distributor',
    permissions: ['manage_users', 'generate_bills', 'view_analytics']
  },
  {
    name: 'John Doe',
    email: 'john@user.com',
    password: 'user123',
    phone: '9123456789',
    role: 'user',
    address: 'Apartment 123, City Complex',
    permissions: ['view_profile', 'create_entries']
  },
  {
    name: 'Jane Smith',
    email: 'jane@user.com',
    password: 'user123',
    phone: '9123456788',
    role: 'user',
    address: 'House 456, Suburb Area',
    permissions: ['view_profile', 'create_entries']
  },
  {
    name: 'Mike Wilson',
    email: 'mike@user.com',
    password: 'user123',
    phone: '9123456787',
    role: 'user',
    address: 'Villa 789, Uptown',
    permissions: ['view_profile', 'create_entries']
  }
];

const seedUsers = async () => {
  try {    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);

    console.log('Connected to MongoDB');

    // Clear existing test users (optional - be careful in production)
    console.log('Clearing existing test users...');
    await User.deleteMany({
      email: { 
        $in: testUsers.map(user => user.email) 
      }
    });

    // Create test users
    console.log('Creating test users...');
    const createdUsers = await User.create(testUsers);

    console.log('✅ Test users created successfully:');
    createdUsers.forEach(user => {
      console.log(`  - ${user.role.toUpperCase()}: ${user.name} (${user.email})`);
    });

    // Create some user-supplier connections
    const supplier1 = createdUsers.find(u => u.email === 'raj@supplier.com');
    const supplier2 = createdUsers.find(u => u.email === 'fresh@supplier.com');
    const user1 = createdUsers.find(u => u.email === 'john@user.com');
    const user2 = createdUsers.find(u => u.email === 'jane@user.com');
    const user3 = createdUsers.find(u => u.email === 'mike@user.com');

    // Connect users to suppliers
    await User.findByIdAndUpdate(user1._id, { supplierId: supplier1._id });
    await User.findByIdAndUpdate(user2._id, { supplierId: supplier1._id });
    await User.findByIdAndUpdate(user3._id, { supplierId: supplier2._id });

    console.log('\n✅ User-Supplier connections created:');
    console.log(`  - ${user1.name} → ${supplier1.businessName}`);
    console.log(`  - ${user2.name} → ${supplier1.businessName}`);
    console.log(`  - ${user3.name} → ${supplier2.businessName}`);

    console.log('\n🔑 Login Credentials:');
    console.log('┌─────────────┬─────────────────────┬─────────────┐');
    console.log('│ Role        │ Email               │ Password    │');
    console.log('├─────────────┼─────────────────────┼─────────────┤');
    console.log('│ SuperAdmin  │ admin@milkman.com   │ admin123    │');
    console.log('│ Supplier 1  │ raj@supplier.com    │ supplier123 │');
    console.log('│ Supplier 2  │ fresh@supplier.com  │ supplier123 │');
    console.log('│ User 1      │ john@user.com       │ user123     │');
    console.log('│ User 2      │ jane@user.com       │ user123     │');
    console.log('│ User 3      │ mike@user.com       │ user123     │');
    console.log('└─────────────┴─────────────────────┴─────────────┘');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

// Run the seeder
if (require.main === module) {
  seedUsers();
}

module.exports = seedUsers;
