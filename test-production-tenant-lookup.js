// Test the production tenant lookup system
const axios = require('axios');

async function testTenantLookup() {
  console.log('🧪 Testing Production Tenant Lookup System\n');
  
  const baseUrl = 'http://localhost:3000';
  
  const testCases = [
    'acme-electronics',
    'beta-retail',
    'non-existent-tenant',
    // Add any new tenant slugs you've created via signup
  ];
  
  console.log('Testing tenant lookup API endpoint...\n');
  
  for (const slug of testCases) {
    try {
      console.log(`Testing: ${slug}`);
      
      const response = await axios.get(`${baseUrl}/api/tenants/lookup?slug=${slug}`, {
        headers: {
          'X-Internal-Request': 'true',
          'User-Agent': 'middleware-tenant-lookup',
        },
      });
      
      const { tenant } = response.data;
      
      if (tenant) {
        console.log(`  ✅ Found: ${tenant.name} (Status: ${tenant.status})`);
      } else {
        console.log(`  ❌ Not found`);
      }
      
    } catch (error) {
      if (error.response) {
        console.log(`  ❌ Error: ${error.response.status} - ${error.response.data.error}`);
      } else {
        console.log(`  ❌ Error: ${error.message}`);
      }
    }
    console.log('');
  }
  
  console.log('📋 Instructions:');
  console.log('1. Create a new tenant via /signup');
  console.log('2. Add the new tenant slug to this test');
  console.log('3. Run the test again to verify it\'s found');
  console.log('4. Try accessing the new tenant subdomain');
}

testTenantLookup().catch(console.error);
