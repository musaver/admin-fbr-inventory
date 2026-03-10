const axios = require('axios');

// Test data for each tenant
const testData = {
  'acme-electronics': {
    name: 'Acme Electronics',
    categories: [
      { name: 'Electronics', description: 'Electronic devices and components' },
      { name: 'Accessories', description: 'Electronic accessories and peripherals' }
    ],
    products: [
      {
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone model with advanced features',
        price: '999.99',
        sku: 'ACME-IPH15P-001'
      },
      {
        name: 'Wireless Charger',
        description: 'Fast wireless charging pad',
        price: '49.99',
        sku: 'ACME-WC-001'
      },
      {
        name: 'Bluetooth Headphones',
        description: 'Premium noise-canceling headphones',
        price: '199.99',
        sku: 'ACME-BT-001'
      }
    ],
    customers: [
      {
        name: 'Alice Cooper',
        email: 'alice@example.com',
        phone: '+1-555-1001',
        address: '123 Main St, Tech City, TC 12345'
      },
      {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        phone: '+1-555-1002',
        address: '456 Oak Ave, Tech City, TC 12345'
      }
    ]
  },
  'beta-retail': {
    name: 'Beta Retail Co',
    categories: [
      { name: 'Clothing', description: 'Apparel and fashion items' },
      { name: 'Home & Garden', description: 'Home improvement and garden supplies' }
    ],
    products: [
      {
        name: 'Premium T-Shirt',
        description: 'High-quality cotton t-shirt',
        price: '29.99',
        sku: 'BETA-TSH-001'
      },
      {
        name: 'Garden Hose',
        description: '50ft expandable garden hose',
        price: '39.99',
        sku: 'BETA-GH-001'
      },
      {
        name: 'Ceramic Planter',
        description: 'Decorative ceramic plant pot',
        price: '24.99',
        sku: 'BETA-CP-001'
      }
    ],
    customers: [
      {
        name: 'Carol Davis',
        email: 'carol@example.com',
        phone: '+1-555-2001',
        address: '789 Pine St, Retail City, RC 12345'
      },
      {
        name: 'David Brown',
        email: 'david@example.com',
        phone: '+1-555-2002',
        address: '321 Elm St, Retail City, RC 12345'
      }
    ]
  }
};

async function createTestDataForTenant(tenantSlug, baseUrl) {
  const data = testData[tenantSlug];
  const tenantUrl = `http://${tenantSlug}.localhost:3000`;
  
  console.log(`\n🏢 Creating test data for ${data.name} (${tenantSlug})`);
  console.log(`   URL: ${tenantUrl}`);
  
  try {
    // Create categories
    console.log('\n📁 Creating categories...');
    const categories = [];
    for (const categoryData of data.categories) {
      try {
        const response = await axios.post(`${baseUrl}/api/categories`, categoryData, {
          headers: {
            'Host': `${tenantSlug}.localhost`,
            'Content-Type': 'application/json'
          }
        });
        categories.push(response.data);
        console.log(`   ✅ Created category: ${categoryData.name}`);
      } catch (error) {
        console.log(`   ❌ Failed to create category ${categoryData.name}:`, error.response?.data?.error || error.message);
      }
    }
    
    // Create products
    console.log('\n📦 Creating products...');
    for (let i = 0; i < data.products.length; i++) {
      const productData = {
        ...data.products[i],
        categoryId: categories[i % categories.length]?.id // Assign to available categories
      };
      
      try {
        const response = await axios.post(`${baseUrl}/api/products`, productData, {
          headers: {
            'Host': `${tenantSlug}.localhost`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`   ✅ Created product: ${productData.name} (${productData.sku})`);
      } catch (error) {
        console.log(`   ❌ Failed to create product ${productData.name}:`, error.response?.data?.error || error.message);
      }
    }
    
    // Create customers
    console.log('\n👥 Creating customers...');
    for (const customerData of data.customers) {
      try {
        const response = await axios.post(`${baseUrl}/api/users`, customerData, {
          headers: {
            'Host': `${tenantSlug}.localhost`,
            'Content-Type': 'application/json'
          }
        });
        console.log(`   ✅ Created customer: ${customerData.name} (${customerData.email})`);
      } catch (error) {
        console.log(`   ❌ Failed to create customer ${customerData.name}:`, error.response?.data?.error || error.message);
      }
    }
    
    console.log(`\n✅ Test data creation completed for ${data.name}`);
    
  } catch (error) {
    console.error(`❌ Error creating test data for ${tenantSlug}:`, error.message);
  }
}

async function verifyDataIsolation(baseUrl) {
  console.log('\n🔍 Verifying data isolation...\n');
  
  const tenants = ['acme-electronics', 'beta-retail'];
  
  for (const tenant of tenants) {
    console.log(`📊 Data for ${tenant}:`);
    
    try {
      // Check categories
      const categoriesResponse = await axios.get(`${baseUrl}/api/categories`, {
        headers: { 'Host': `${tenant}.localhost` }
      });
      console.log(`   Categories: ${categoriesResponse.data.length} found`);
      categoriesResponse.data.forEach(cat => console.log(`     - ${cat.name}`));
      
      // Check products
      const productsResponse = await axios.get(`${baseUrl}/api/products`, {
        headers: { 'Host': `${tenant}.localhost` }
      });
      console.log(`   Products: ${productsResponse.data.length} found`);
      productsResponse.data.forEach(prod => console.log(`     - ${prod.name} (${prod.sku})`));
      
      // Check customers
      const customersResponse = await axios.get(`${baseUrl}/api/users`, {
        headers: { 'Host': `${tenant}.localhost` }
      });
      console.log(`   Customers: ${customersResponse.data.length} found`);
      customersResponse.data.forEach(user => console.log(`     - ${user.name} (${user.email})`));
      
    } catch (error) {
      console.log(`   ❌ Error fetching data: ${error.response?.data?.error || error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
}

async function main() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 Multi-Tenant Data Creation and Testing Script');
  console.log('================================================\n');
  
  // Check if server is running
  try {
    await axios.get(baseUrl);
    console.log('✅ Server is running at', baseUrl);
  } catch (error) {
    console.error('❌ Server is not running. Please run: npm run dev');
    return;
  }
  
  // Create test data for both tenants
  await createTestDataForTenant('acme-electronics', baseUrl);
  await createTestDataForTenant('beta-retail', baseUrl);
  
  // Verify data isolation
  await verifyDataIsolation(baseUrl);
  
  console.log('\n🎉 Testing completed!');
  console.log('\n📋 Manual Testing Steps:');
  console.log('1. Add these to /etc/hosts:');
  console.log('   127.0.0.1 acme-electronics.localhost');
  console.log('   127.0.0.1 beta-retail.localhost');
  console.log('');
  console.log('2. Login to each tenant:');
  console.log('   • http://acme-electronics.localhost:3000/login');
  console.log('     Email: admin@acme-electronics.com');
  console.log('     Password: admin123');
  console.log('');
  console.log('   • http://beta-retail.localhost:3000/login');
  console.log('     Email: admin@beta-retail.com');
  console.log('     Password: admin123');
  console.log('');
  console.log('3. Verify each tenant only sees their own data');
}

main().catch(console.error);
