const { drizzle } = require('drizzle-orm/mysql2');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

// Import schema
const { 
  tenants, 
  adminUsers, 
  user, 
  products, 
  categories, 
  orders,
  orderItems,
  productInventory
} = require('../lib/schema');

require('dotenv').config({ path: '.env.local' });

async function createTestData() {
  console.log('🚀 Starting multi-tenant test data creation...\n');

  // Create database connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  const db = drizzle(connection);

  try {
    // 1. Create Test Tenants
    console.log('1️⃣ Creating test tenants...');
    
    const tenant1Id = uuidv4();
    const tenant2Id = uuidv4();
    
    const testTenants = [
      {
        id: tenant1Id,
        name: 'Acme Electronics',
        slug: 'acme-electronics',
        email: 'admin@acme-electronics.com',
        plan: 'premium',
        status: 'active',
        trialEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: tenant2Id,
        name: 'Beta Retail Co',
        slug: 'beta-retail',
        email: 'admin@beta-retail.com',
        plan: 'basic',
        status: 'active',
        trialEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Insert tenants
    for (const tenant of testTenants) {
      await db.insert(tenants).values(tenant);
      console.log(`   ✅ Created tenant: ${tenant.name} (${tenant.slug})`);
    }

    // 2. Create Admin Users for each tenant
    console.log('\n2️⃣ Creating admin users...');
    
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const testAdmins = [
      {
        id: uuidv4(),
        tenantId: tenant1Id,
        email: 'admin@acme-electronics.com',
        password: hashedPassword,
        name: 'John Smith',
        roleId: 'super_admin',
        role: 'super_admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        tenantId: tenant2Id,
        email: 'admin@beta-retail.com',
        password: hashedPassword,
        name: 'Sarah Johnson',
        roleId: 'super_admin',
        role: 'super_admin',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    for (const admin of testAdmins) {
      await db.insert(adminUsers).values(admin);
      console.log(`   ✅ Created admin: ${admin.name} for ${admin.email}`);
    }

    // 3. Create Categories for each tenant
    console.log('\n3️⃣ Creating categories...');
    
    const tenant1Categories = [
      {
        id: uuidv4(),
        tenantId: tenant1Id,
        name: 'Electronics',
        description: 'Electronic devices and components',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        tenantId: tenant1Id,
        name: 'Accessories',
        description: 'Electronic accessories',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    const tenant2Categories = [
      {
        id: uuidv4(),
        tenantId: tenant2Id,
        name: 'Clothing',
        description: 'Apparel and fashion items',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        tenantId: tenant2Id,
        name: 'Home & Garden',
        description: 'Home improvement and garden items',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    const allCategories = [...tenant1Categories, ...tenant2Categories];
    for (const category of allCategories) {
      await db.insert(categories).values(category);
      console.log(`   ✅ Created category: ${category.name} for tenant ${category.tenantId.substring(0, 8)}...`);
    }

    // 4. Create Products for each tenant
    console.log('\n4️⃣ Creating products...');
    
    const tenant1Products = [
      {
        id: uuidv4(),
        tenantId: tenant1Id,
        categoryId: tenant1Categories[0].id,
        name: 'iPhone 15 Pro',
        description: 'Latest iPhone model with advanced features',
        price: '999.99',
        sku: 'ACME-IPH15P-001',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        tenantId: tenant1Id,
        categoryId: tenant1Categories[1].id,
        name: 'Wireless Charger',
        description: 'Fast wireless charging pad',
        price: '49.99',
        sku: 'ACME-WC-001',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    const tenant2Products = [
      {
        id: uuidv4(),
        tenantId: tenant2Id,
        categoryId: tenant2Categories[0].id,
        name: 'Premium T-Shirt',
        description: 'High-quality cotton t-shirt',
        price: '29.99',
        sku: 'BETA-TSH-001',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        tenantId: tenant2Id,
        categoryId: tenant2Categories[1].id,
        name: 'Garden Hose',
        description: '50ft expandable garden hose',
        price: '39.99',
        sku: 'BETA-GH-001',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    const allProducts = [...tenant1Products, ...tenant2Products];
    for (const product of allProducts) {
      await db.insert(products).values(product);
      console.log(`   ✅ Created product: ${product.name} for tenant ${product.tenantId.substring(0, 8)}...`);
    }

    // 5. Create Customers for each tenant
    console.log('\n5️⃣ Creating customers...');
    
    const tenant1Customers = [
      {
        id: uuidv4(),
        tenantId: tenant1Id,
        name: 'Alice Cooper',
        email: 'alice@example.com',
        phone: '+1234567890',
        address: '123 Main St, City, State 12345',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        tenantId: tenant1Id,
        name: 'Bob Wilson',
        email: 'bob@example.com',
        phone: '+1234567891',
        address: '456 Oak Ave, City, State 12345',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    const tenant2Customers = [
      {
        id: uuidv4(),
        tenantId: tenant2Id,
        name: 'Carol Davis',
        email: 'carol@example.com',
        phone: '+1234567892',
        address: '789 Pine St, City, State 12345',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        tenantId: tenant2Id,
        name: 'David Brown',
        email: 'david@example.com',
        phone: '+1234567893',
        address: '321 Elm St, City, State 12345',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    const allCustomers = [...tenant1Customers, ...tenant2Customers];
    for (const customer of allCustomers) {
      await db.insert(user).values(customer);
      console.log(`   ✅ Created customer: ${customer.name} for tenant ${customer.tenantId.substring(0, 8)}...`);
    }

    // 6. Create Orders for each tenant
    console.log('\n6️⃣ Creating orders...');
    
    const tenant1Orders = [
      {
        id: uuidv4(),
        tenantId: tenant1Id,
        userId: tenant1Customers[0].id,
        orderNumber: 'ACME-001',
        status: 'completed',
        totalAmount: '1049.98',
        subtotal: '1049.98',
        tax: '0.00',
        shippingCost: '0.00',
        paymentStatus: 'paid',
        paymentMethod: 'credit_card',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    const tenant2Orders = [
      {
        id: uuidv4(),
        tenantId: tenant2Id,
        userId: tenant2Customers[0].id,
        orderNumber: 'BETA-001',
        status: 'completed',
        totalAmount: '69.98',
        subtotal: '69.98',
        tax: '0.00',
        shippingCost: '0.00',
        paymentStatus: 'paid',
        paymentMethod: 'credit_card',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    const allOrders = [...tenant1Orders, ...tenant2Orders];
    for (const order of allOrders) {
      await db.insert(orders).values(order);
      console.log(`   ✅ Created order: ${order.orderNumber} for tenant ${order.tenantId.substring(0, 8)}...`);
    }

    // 7. Create Order Items
    console.log('\n7️⃣ Creating order items...');
    
    const orderItemsData = [
      {
        id: uuidv4(),
        tenantId: tenant1Id,
        orderId: tenant1Orders[0].id,
        productId: tenant1Products[0].id,
        quantity: 1,
        unitPrice: '999.99',
        totalPrice: '999.99',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        tenantId: tenant1Id,
        orderId: tenant1Orders[0].id,
        productId: tenant1Products[1].id,
        quantity: 1,
        unitPrice: '49.99',
        totalPrice: '49.99',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        tenantId: tenant2Id,
        orderId: tenant2Orders[0].id,
        productId: tenant2Products[0].id,
        quantity: 1,
        unitPrice: '29.99',
        totalPrice: '29.99',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        tenantId: tenant2Id,
        orderId: tenant2Orders[0].id,
        productId: tenant2Products[1].id,
        quantity: 1,
        unitPrice: '39.99',
        totalPrice: '39.99',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    for (const item of orderItemsData) {
      await db.insert(orderItems).values(item);
      console.log(`   ✅ Created order item for tenant ${item.tenantId.substring(0, 8)}...`);
    }

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📊 Summary:');
    console.log(`   • 2 Tenants created`);
    console.log(`   • 2 Admin users created (password: admin123)`);
    console.log(`   • 4 Categories created (2 per tenant)`);
    console.log(`   • 4 Products created (2 per tenant)`);
    console.log(`   • 4 Customers created (2 per tenant)`);
    console.log(`   • 2 Orders created (1 per tenant)`);
    console.log(`   • 4 Order items created`);

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

    console.log('\n🧪 Testing Instructions:');
    console.log('1. Add these entries to your /etc/hosts file:');
    console.log('   127.0.0.1 acme-electronics.localhost');
    console.log('   127.0.0.1 beta-retail.localhost');
    console.log('');
    console.log('2. Login to each tenant and verify:');
    console.log('   • Products are isolated (Acme sees electronics, Beta sees clothing)');
    console.log('   • Customers are isolated (each tenant sees only their customers)');
    console.log('   • Orders are isolated (each tenant sees only their orders)');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await connection.end();
  }
}

// Run the script
createTestData().catch(console.error);
