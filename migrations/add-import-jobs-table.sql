-- Add Import Jobs table for bulk import tracking
-- Run this migration to add bulk import functionality

CREATE TABLE IF NOT EXISTS `import_jobs` (
  `id` varchar(255) NOT NULL PRIMARY KEY,
  `tenant_id` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'users',
  `file_name` varchar(255) NOT NULL,
  `blob_url` varchar(500) NOT NULL,
  `status` varchar(20) DEFAULT 'pending',
  
  -- Progress tracking
  `total_records` int DEFAULT 0,
  `processed_records` int DEFAULT 0,
  `successful_records` int DEFAULT 0,
  `failed_records` int DEFAULT 0,
  
  -- Results and errors (JSON columns)
  `errors` json,
  `results` json,
  
  -- Timestamps
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `started_at` timestamp NULL,
  `completed_at` timestamp NULL,
  
  -- Metadata
  `created_by` varchar(255) NOT NULL,
  
  -- Foreign key constraint
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  
  -- Indexes for performance
  INDEX `idx_tenant_id` (`tenant_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_type` (`type`),
  INDEX `idx_created_at` (`created_at`)
);

-- Add some helpful comments
ALTER TABLE `import_jobs` COMMENT = 'Tracks bulk import operations with progress and results';
