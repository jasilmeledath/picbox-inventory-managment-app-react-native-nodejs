require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function createTestAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check if test admin exists
    const existingUser = await User.findOne({ email: 'test@picbox.com' });
    
    if (existingUser) {
      console.log('⚠️  Test admin already exists!');
      console.log('Email: test@picbox.com');
      console.log('Password: Test@123\n');
      
      // Delete and recreate with known password
      await User.deleteOne({ email: 'test@picbox.com' });
      console.log('🗑️  Deleted old test admin, creating new one...\n');
    }

    // Create new test admin
    const testAdmin = new User({
      email: 'test@picbox.com',
      passwordHash: 'Test@123', // Will be hashed by pre-save hook
      name: 'Test Admin',
      isAdmin: true
    });

    await testAdmin.save();

    console.log('✅ Test admin created successfully!\n');
    console.log('=' .repeat(40));
    console.log('📧 Email:    test@picbox.com');
    console.log('🔑 Password: Test@123');
    console.log('👤 Name:     Test Admin');
    console.log('🔐 Role:     Admin');
    console.log('=' .repeat(40));
    console.log('\n✅ You can now login with these credentials!\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestAdmin();
