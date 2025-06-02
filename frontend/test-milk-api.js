// Test script to verify milk API endpoints
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testMilkAPI() {
  try {
    console.log('🧪 Testing Milk API endpoints...\n');
    
    // First, login to get a token
    console.log('1. Logging in as test user...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'john@user.com',
      password: 'user123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login successful');
      const token = loginResponse.data.token;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Test adding a milk entry
      console.log('\n2. Testing add milk entry...');
      const today = new Date().toISOString().split('T')[0];
      
      const entryResponse = await axios.post(`${API_BASE}/milk/add-entry`, {
        date: today,
        quantity: 2.5
      }, { headers });
      
      if (entryResponse.data.success) {
        console.log('✅ Milk entry added successfully');
        console.log('Entry data:', entryResponse.data.data);
        
        // Test getting daily entry
        console.log('\n3. Testing get daily entry...');
        const dailyResponse = await axios.get(`${API_BASE}/milk/daily-entry/${today}`, { headers });
        
        if (dailyResponse.data.success) {
          console.log('✅ Daily entry retrieved successfully');
          console.log('Daily entry:', dailyResponse.data.data);
        } else {
          console.log('❌ Failed to get daily entry:', dailyResponse.data.message);
        }
      } else {
        console.log('❌ Failed to add entry:', entryResponse.data.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testMilkAPI();
