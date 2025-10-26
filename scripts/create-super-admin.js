/**
 * Enhanced script to create super admin and sample tenant admins
 * Run with: node scripts/create-super-admin.js
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function setupAdminUsers() {
  console.log('🚀 Setting up admin users...');

  try {
    // Create database connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '',
      database: process.env.DB_NAME || 'inventory_admin',
      port: parseInt(process.env.DB_PORT || '3306'),
    });

    // Database connection established

    // Create super admin role if it doesn't exist
    console.log('📋 Creating super admin role...');
    
    let superAdminRoleId = uuidv4();
    const superAdminPermissions = JSON.stringify([
      'all', // Super admin has all permissions
      'manage_tenants',
      'manage_admins',
      'view_all_data',
      'system_settings'
    ]);

    try {
      await connection.execute(
        'INSERT INTO admin_roles (id, name, permissions, createdAt, updatedAt) VALUES (?, ?, ?, NOW(), NOW())',
        [superAdminRoleId, 'Super Administrator', superAdminPermissions]
      );
      console.log('✅ Super admin role created');
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('ℹ️  Super admin role already exists');
        // Get existing role
        const [rows] = await connection.execute(
          'SELECT id FROM admin_roles WHERE name = ? LIMIT 1',
          ['Super Administrator']
        );
        if (rows.length > 0) {
          superAdminRoleId = rows[0].id;
        }
      } else {
        throw error;
      }
    }

    // Create super admin user
    console.log('👤 Creating super admin user...');
    
    const email = process.env.SUPER_ADMIN_EMAIL || 'admin@yourdomain.com';
    const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin123!';
    const name = 'Super Administrator';

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      await connection.execute(
        'INSERT INTO admin_users (id, tenantId, email, password, name, type, roleId, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [uuidv4(), 'super-admin', email, hashedPassword, name, 'super-admin', superAdminRoleId, 'Super Administrator']
      );

      console.log('✅ Super admin user created successfully!');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      console.log('🌐 Login URL: http://localhost:3000/login (main domain)');
      
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log('ℹ️  Super admin user already exists');
        console.log('📧 Email:', email);
        console.log('🌐 Login URL: http://localhost:3000/login (main domain)');
      } else {
        throw error;
      }
    }

    // Create sample tenants and tenant admins
    await createSampleTenants(connection, superAdminRoleId);

    console.log('');
    console.log('⚠️  Please change passwords after first login!');
    console.log('');

    await connection.end();

  } catch (error) {
    console.error('❌ Error setting up admin users:', error);
    process.exit(1);
  }
}

async function createSampleTenants(connection, adminRoleId) {
  console.log('');
  console.log('🏢 Creating sample tenants and tenant admins...');

  const sampleTenants = [
    {
      id: 'tenant-demo-1',
      name: 'Demo Store 1',
      slug: 'demo1',
      email: 'demo1@example.com',
      status: 'active',
      adminEmail: 'admin@demo1.com',
      adminPassword: 'Demo123!',
      adminName: 'Demo 1 Admin'
    },
    {
      id: 'tenant-demo-2', 
      name: 'Demo Store 2',
      slug: 'demo2',
      email: 'demo2@example.com',
      status: 'active',
      adminEmail: 'admin@demo2.com',
      adminPassword: 'Demo123!',
      adminName: 'Demo 2 Admin'
    }
  ];

  for (const tenant of sampleTenants) {
    try {
      // Create tenant
      await connection.execute(
        'INSERT INTO tenants (id, name, slug, email, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [tenant.id, tenant.name, tenant.slug, tenant.email, tenant.status]
      );
      console.log(`✅ Created tenant: ${tenant.name} (${tenant.slug})`);

      // Create tenant admin
      const hashedPassword = await bcrypt.hash(tenant.adminPassword, 10);
      await connection.execute(
        'INSERT INTO admin_users (id, tenantId, email, password, name, type, roleId, role, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())',
        [uuidv4(), tenant.id, tenant.adminEmail, hashedPassword, tenant.adminName, 'admin', adminRoleId, 'Administrator']
      );
      console.log(`✅ Created tenant admin: ${tenant.adminEmail}`);
      console.log(`   🌐 Login URL: http://${tenant.slug}.localhost:3000/login`);
      console.log(`   🔑 Password: ${tenant.adminPassword}`);

    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`ℹ️  Tenant ${tenant.name} and admin already exist`);
        console.log(`   🌐 Login URL: http://${tenant.slug}.localhost:3000/login`);
      } else {
        console.error(`❌ Error creating tenant ${tenant.name}:`, error.message);
      }
    }
  }
}

// Run the script
setupAdminUsers();