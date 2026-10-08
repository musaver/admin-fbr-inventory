-- Multi-tenant Migration Script
-- This script adds tenant support to existing tables
-- Run this after creating the tenants table

-- 1. Create tenants table
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL UNIQUE,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20),
  `plan` varchar(50) DEFAULT 'basic',
  `status` varchar(20) DEFAULT 'active',
  `trial_ends_at` datetime,
  `subscription_id` varchar(255),
  `logo` varchar(500),
  `primary_color` varchar(7) DEFAULT '#3b82f6',
  `settings` json,
  `max_users` int DEFAULT 5,
  `max_products` int DEFAULT 1000,
  `max_orders` int DEFAULT 10000,
  `address` varchar(500),
  `city` varchar(100),
  `state` varchar(100),
  `country` varchar(100),
  `postal_code` varchar(20),
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. Add tenant_id to existing tables
-- IMPORTANT: Run these one by one and check for errors

-- Add tenant_id to admin_users (this table should be updated first)
ALTER TABLE `admin_users` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `admin_users` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to user table (customers)
ALTER TABLE `user` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `user` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to categories
ALTER TABLE `categories` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `categories` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to subcategories
ALTER TABLE `subcategories` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `subcategories` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to products
ALTER TABLE `products` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `products` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to orders
ALTER TABLE `orders` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `orders` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to suppliers (if you have this table)
ALTER TABLE `suppliers` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `suppliers` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to product_variants
ALTER TABLE `product_variants` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `product_variants` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to product_inventory
ALTER TABLE `product_inventory` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `product_inventory` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to stock_movements
ALTER TABLE `stock_movements` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `stock_movements` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to drivers
ALTER TABLE `drivers` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `drivers` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to addons
ALTER TABLE `addons` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `addons` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to addon_groups
ALTER TABLE `addon_groups` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `addon_groups` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to tags
ALTER TABLE `tags` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `tags` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to tag_groups
ALTER TABLE `tag_groups` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `tag_groups` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to variation_attributes
ALTER TABLE `variation_attributes` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `variation_attributes` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to variation_attribute_values
ALTER TABLE `variation_attribute_values` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `variation_attribute_values` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to returns
ALTER TABLE `returns` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `returns` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to refunds
ALTER TABLE `refunds` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `refunds` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to return_items
ALTER TABLE `return_items` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `return_items` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to shipping_labels
ALTER TABLE `shipping_labels` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `shipping_labels` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to driver_assignments
ALTER TABLE `driver_assignments` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `driver_assignments` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to driver_assignment_history
ALTER TABLE `driver_assignment_history` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `driver_assignment_history` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to product_addons
ALTER TABLE `product_addons` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `product_addons` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to product_tags
ALTER TABLE `product_tags` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `product_tags` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- Add tenant_id to order_items
ALTER TABLE `order_items` ADD COLUMN `tenant_id` varchar(255) NOT NULL AFTER `id`;
ALTER TABLE `order_items` ADD FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE;

-- 3. Create indexes for better performance
CREATE INDEX idx_admin_users_tenant_id ON admin_users(tenant_id);
CREATE INDEX idx_user_tenant_id ON user(tenant_id);
CREATE INDEX idx_products_tenant_id ON products(tenant_id);
CREATE INDEX idx_orders_tenant_id ON orders(tenant_id);
CREATE INDEX idx_categories_tenant_id ON categories(tenant_id);
CREATE INDEX idx_suppliers_tenant_id ON suppliers(tenant_id);

-- 4. Update unique constraints to be tenant-scoped
-- Drop existing unique constraints that should be tenant-scoped
ALTER TABLE `categories` DROP INDEX `slug`;
ALTER TABLE `subcategories` DROP INDEX `slug`;
ALTER TABLE `products` DROP INDEX `slug`;
ALTER TABLE `products` DROP INDEX `sku`;

-- Add new tenant-scoped unique constraints
ALTER TABLE `categories` ADD UNIQUE KEY `unique_tenant_slug` (`tenant_id`, `slug`);
ALTER TABLE `subcategories` ADD UNIQUE KEY `unique_tenant_slug` (`tenant_id`, `slug`);
ALTER TABLE `products` ADD UNIQUE KEY `unique_tenant_slug` (`tenant_id`, `slug`);
ALTER TABLE `products` ADD UNIQUE KEY `unique_tenant_sku` (`tenant_id`, `sku`);

-- 5. Update admin_users email to be tenant-scoped (admins can have same email across tenants)
ALTER TABLE `admin_users` DROP INDEX `email`;
ALTER TABLE `admin_users` ADD UNIQUE KEY `unique_tenant_email` (`tenant_id`, `email`);

-- Note: After running this migration, you'll need to:
-- 1. Update all existing records to have a tenant_id (create a default tenant first)
-- 2. Update all API routes to filter by tenant_id
-- 3. Update the frontend to handle tenant context
-- 4. Test thoroughly before deploying to production
