-- Add type column to admin_users table
-- Run this migration before using the enhanced setup script

ALTER TABLE admin_users 
ADD COLUMN type VARCHAR(50) NOT NULL DEFAULT 'admin' 
COMMENT 'Admin type: super-admin or admin';

-- Update existing admin users to have proper types
-- This assumes any existing admins with tenantId 'super-admin' should be type 'super-admin'
UPDATE admin_users 
SET type = 'super-admin' 
WHERE tenantId = 'super-admin';

-- Create index for better performance on type queries
CREATE INDEX idx_admin_users_type ON admin_users(type);
CREATE INDEX idx_admin_users_tenant_type ON admin_users(tenantId, type);