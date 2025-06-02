// Quick Local MongoDB Setup for Development
const mongoose = require('mongoose');

// Local MongoDB connection with fallback
const connectDB = async () => {
  try {
    // Try local MongoDB first
    console.log('🔄 Attempting to connect to local MongoDB...');
    
    const localConn = await mongoose.connect('mongodb://localhost:27017/milkman', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 3000, // Quick timeout for local
    });

    console.log('✅ Connected to Local MongoDB');
    console.log(`📍 Database: ${localConn.connection.name}`);
    return localConn;
    
  } catch (localError) {
    console.log('❌ Local MongoDB not available, trying Atlas...');
    
    try {
      // Fallback to Atlas with current credentials
      const atlasConn = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
      });
      
      console.log('✅ Connected to MongoDB Atlas');
      console.log(`📍 Host: ${atlasConn.connection.host}`);
      return atlasConn;
      
    } catch (atlasError) {
      console.error('❌ Both local and Atlas connections failed');
      console.error('Local error:', localError.message);
      console.error('Atlas error:', atlasError.message);
      throw new Error('No database connection available');
    }
  }
};

module.exports = connectDB;
