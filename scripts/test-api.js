const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function createTestTenants() {
  console.log('🚀 Creating test tenants via API...\n');

  try {
    // 1. Create Tenant 1 - Acme Electronics
    console.log('1️⃣ Creating Acme Electronics tenant...');
    const tenant1Response = await axios.post(`${BASE_URL}/api/tenants/register`, {
      companyName: 'Acme Electronics',
      subdomain: 'acme-electronics',
      email: 'admin@acme-electronics.com',
      phone: '+1-555-0101',
      adminName: 'John Smith',
      adminEmail: 'admin@acme-electronics.com',
      adminPassword: 'admin123',
      plan: 'premium'
    });
    
    console.log('   ✅ Acme Electronics created:', tenant1Response.data);

    // 2. Create Tenant 2 - Beta Retail
    console.log('\n2️⃣ Creating Beta Retail tenant...');
    const tenant2Response = await axios.post(`${BASE_URL}/api/tenants/register`, {
      companyName: 'Beta Retail Co',
      subdomain: 'beta-retail',
      email: 'admin@beta-retail.com',
      phone: '+1-555-0102',
      adminName: 'Sarah Johnson',
      adminEmail: 'admin@beta-retail.com',
      adminPassword: 'admin123',
      plan: 'basic'
    });
    
    console.log('   ✅ Beta Retail created:', tenant2Response.data);

    console.log('\n🎉 Test tenants created successfully!');
    console.log('\n🔐 Login Credentials:');
    console.log('   Tenant 1 (acme-electronics):');
    console.log('   • Email: admin@acme-electronics.com');
    console.log('   • Password: admin123');
    console.log('   • URL: http://acme-electronics.localhost:3000');
    console.log('');
    console.log('   Tenant 2 (beta-retail):');
    console.log('   • Email: admin@beta-retail.com');
    console.log('   • Password: admin123');
    console.log('   • URL: http://beta-retail.localhost:3000');

    console.log('\n🧪 Next Steps:');
    console.log('1. Add these entries to your /etc/hosts file:');
    console.log('   127.0.0.1 acme-electronics.localhost');
    console.log('   127.0.0.1 beta-retail.localhost');
    console.log('');
    console.log('2. Or use ngrok for testing:');
    console.log('   npx ngrok http 3000');
    console.log('   Then use subdomains like: acme-electronics.your-ngrok-url.ngrok.io');

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.data);
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/`);
    console.log('✅ Server is running at', BASE_URL);
    return true;
  } catch (error) {
    console.error('❌ Server is not running at', BASE_URL);
    console.log('Please run: npm run dev');
    return false;
  }
}

async function main() {
  console.log('🔍 Checking if server is running...');
  const isRunning = await checkServer();
  
  if (isRunning) {
    await createTestTenants();
  }
}

main().catch(console.error);
