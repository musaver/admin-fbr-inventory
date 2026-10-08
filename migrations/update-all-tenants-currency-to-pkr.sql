-- Update all existing tenants to use PKR as default currency
-- This migration ensures all tenants (new and existing) use PKR instead of USD

-- 1. Update tenant settings JSON to change currency from USD to PKR
UPDATE `tenants` 
SET `settings` = JSON_SET(
    COALESCE(`settings`, '{}'), 
    '$.currency', 
    'PKR'
) 
WHERE JSON_EXTRACT(`settings`, '$.currency') = 'USD' 
   OR JSON_EXTRACT(`settings`, '$.currency') IS NULL 
   OR `settings` IS NULL;

-- 2. Update any existing currency settings in the settings table to PKR
UPDATE `settings` 
SET `value` = 'PKR', 
    `updated_at` = CURRENT_TIMESTAMP 
WHERE `key` = 'selected_currency' 
  AND `value` = 'USD';

-- 3. For tenants without any currency setting, create a default PKR setting
INSERT INTO `settings` (
    `id`, 
    `tenant_id`, 
    `key`, 
    `value`, 
    `type`, 
    `description`, 
    `is_active`, 
    `created_at`, 
    `updated_at`
)
SELECT 
    UUID() as `id`,
    t.`id` as `tenant_id`,
    'selected_currency' as `key`,
    'PKR' as `value`,
    'string' as `type`,
    'Default currency set to PKR' as `description`,
    true as `is_active`,
    CURRENT_TIMESTAMP as `created_at`,
    CURRENT_TIMESTAMP as `updated_at`
FROM `tenants` t
WHERE t.`id` NOT IN (
    SELECT DISTINCT s.`tenant_id` 
    FROM `settings` s 
    WHERE s.`key` = 'selected_currency' 
      AND s.`tenant_id` IS NOT NULL
)
AND t.`id` IS NOT NULL;

-- Display summary of changes
SELECT 
    'Tenants updated' as operation,
    COUNT(*) as count
FROM `tenants` 
WHERE JSON_EXTRACT(`settings`, '$.currency') = 'PKR';

SELECT 
    'Currency settings updated' as operation,
    COUNT(*) as count
FROM `settings` 
WHERE `key` = 'selected_currency' AND `value` = 'PKR';
