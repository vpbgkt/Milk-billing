// Simple test to verify servers are accessible
const http = require('http');

console.log('🚀 Starting simple server connectivity test...');

// Test frontend
const frontendReq = http.request('http://localhost:3000', (res) => {
  console.log(`✅ Frontend server responded with status: ${res.statusCode}`);
  
  // Test backend after frontend succeeds
  const backendReq = http.request('http://localhost:5000/api/health', (backendRes) => {
    console.log(`✅ Backend server responded with status: ${backendRes.statusCode}`);
    
    let data = '';
    backendRes.on('data', chunk => data += chunk);
    backendRes.on('end', () => {
      console.log('Backend response:', data);
      console.log('🎉 Both servers are accessible!');
      process.exit(0);
    });
  });
  
  backendReq.on('error', (err) => {
    console.error('❌ Backend server error:', err.message);
    process.exit(1);
  });
  
  backendReq.end();
});

frontendReq.on('error', (err) => {
  console.error('❌ Frontend server error:', err.message);
  process.exit(1);
});

frontendReq.setTimeout(5000, () => {
  console.error('❌ Frontend request timeout');
  process.exit(1);
});

frontendReq.end();
