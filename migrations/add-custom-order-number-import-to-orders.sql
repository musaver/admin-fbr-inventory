-- Add custom_order_number_import column to orders table
-- Stores the original "Order Number" from a bulk CSV import. The application still
-- generates its own unique order_number; this column may repeat across orders.
--
-- Only needed on databases where the column is missing. Check first with:
--   SHOW COLUMNS FROM orders LIKE 'custom_order_number_import';
-- (The column is also created by `npm run db:push` from lib/schema.ts.)

ALTER TABLE orders
ADD COLUMN custom_order_number_import VARCHAR(255) NULL
COMMENT 'Original order number from import file (can have duplicates)';
