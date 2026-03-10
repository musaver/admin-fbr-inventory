-- Manual SQL script to create super admin and sample tenants
-- Run this in your database management tool

-- First, add the type column if it doesn't exist
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) NOT NULL DEFAULT 'admin' 
COMMENT 'Admin type: super-admin or admin';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_type ON admin_users(type);
CREATE INDEX IF NOT EXISTS idx_admin_users_tenant_type ON admin_users(tenantId, type);

-- Create super admin role
INSERT IGNORE INTO admin_roles (id, name, permissions, createdAt, updatedAt) 
VALUES (
  'super-admin-role-001',
  'Super Administrator',
  '["all", "manage_tenants", "manage_admins", "view_all_data", "system_settings"]',
  NOW(),
  NOW()
);

-- Create super admin user
-- Password: SuperAdmin123! (hashed with bcrypt)
INSERT IGNORE INTO admin_users (
  id, 
  tenantId, 
  email, 
  password, 
  name, 
  type, 
  roleId, 
  role, 
  createdAt, 
  updatedAt
) VALUES (
  'super-admin-001',
  'super-admin',
  'admin@yourdomain.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- SuperAdmin123!
  'Super Administrator',
  'super-admin',
  'super-admin-role-001',
  'Super Administrator',
  NOW(),
  NOW()
);

-- Create sample tenants
INSERT IGNORE INTO tenants (id, name, slug, email, status, plan, createdAt, updatedAt) VALUES
('tenant-demo-1', 'Demo Store 1', 'demo1', 'demo1@example.com', 'active', 'basic', NOW(), NOW()),
('tenant-demo-2', 'Demo Store 2', 'demo2', 'demo2@example.com', 'active', 'basic', NOW(), NOW());

-- Create tenant admin role if not exists
INSERT IGNORE INTO admin_roles (id, name, permissions, createdAt, updatedAt) 
VALUES (
  'tenant-admin-role-001',
  'Tenant Administrator',
  '["manage_products", "manage_orders", "manage_users", "view_reports"]',
  NOW(),
  NOW()
);

-- Create tenant admins
-- Password: Demo123! (hashed with bcrypt)
INSERT IGNORE INTO admin_users (
  id, 
  tenantId, 
  email, 
  password, 
  name, 
  type, 
  roleId, 
  role, 
  createdAt, 
  updatedAt
) VALUES 
(
  'tenant-admin-demo1-001',
  'tenant-demo-1',
  'admin@demo1.com',
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPJFcZlobs', -- Demo123!
  'Demo 1 Admin',
  'admin',
  'tenant-admin-role-001',
  'Tenant Administrator',
  NOW(),
  NOW()
),
(
  'tenant-admin-demo2-001',
  'tenant-demo-2',
  'admin@demo2.com',
  '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPJFcZlobs', -- Demo123!
  'Demo 2 Admin',
  'admin',
  'tenant-admin-role-001',
  'Tenant Administrator',
  NOW(),
  NOW()
);

-- Display created users
SELECT 
  name,
  email,
  type,
  tenantId,
  'Login at: http://localhost:3000/login' as login_url
FROM admin_users 
WHERE type = 'super-admin'
UNION ALL
SELECT 
  au.name,
  au.email,
  au.type,
  au.tenantId,
  CONCAT('Login at: http://', t.slug, '.localhost:3000/login') as login_url
FROM admin_users au
JOIN tenants t ON au.tenantId = t.id
WHERE au.type = 'admin'
ORDER BY type DESC, name;