-- Add tenant_id column to settings table for multi-tenant support 
-- This allows each tenant to have their own settings including FBR configuration

-- 1. Add tenant_id column to settings table
ALTER TABLE `settings` ADD COLUMN `tenant_id` varchar(255) AFTER `id`;

-- 2. Add foreign key constraint
ALTER TABLE `settings` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- 3. Update the unique constraint to include tenant_id
-- First, drop the existing unique constraint on key
ALTER TABLE `settings` DROP INDEX `settings_key_unique`;

-- Then add a new composite unique constraint on (tenant_id, key)
-- This allows the same setting key to exist for different tenants
ALTER TABLE `settings` ADD UNIQUE KEY `settings_tenant_key_unique` (`tenant_id`, `key`);

-- 4. Create index for better query performance
ALTER TABLE `settings` ADD INDEX `idx_settings_tenant_id` (`tenant_id`);
