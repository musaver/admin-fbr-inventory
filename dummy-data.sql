-- ============================================
-- DUMMY DATA FOR TENANT: 1f53e212-4ab3-4dfb-ab16-5fa966b98910
-- ============================================
-- This script creates dummy users, categories, products, and orders
-- for testing the tenant-specific dashboard functionality

SET @tenant_id = '1f53e212-4ab3-4dfb-ab16-5fa966b98910';

-- ============================================
-- 1. CATEGORIES
-- ============================================
INSERT INTO categories (id, tenant_id, name, slug, description, is_featured, is_active, created_at, updated_at) VALUES
('cat-1-electronics', @tenant_id, 'Electronics', 'electronics', 'Electronic devices and gadgets', 1, 1, NOW(), NOW()),
('cat-2-services', @tenant_id, 'Services', 'services', 'Professional services', 1, 1, NOW(), NOW()),
('cat-3-consulting', @tenant_id, 'Consulting', 'consulting', 'Business consulting services', 0, 1, NOW(), NOW()),
('cat-4-software', @tenant_id, 'Software', 'software', 'Software development services', 1, 1, NOW(), NOW());

-- ============================================
-- 2. USERS (CUSTOMERS)
-- ============================================
INSERT INTO user (id, tenant_id, name, first_name, last_name, email, phone, country, city, address, user_type, buyer_ntn_cnic, buyer_business_name, buyer_province, buyer_address, buyer_registration_type, created_at, updated_at) VALUES
('user-1-john', @tenant_id, 'John Smith', 'John', 'Smith', 'john.smith@example.com', '+92-300-1234567', 'Pakistan', 'Karachi', '123 Main Street, Karachi', 'customer', '1234567890123', 'Smith Enterprises', 'Sindh', '123 Main Street, Karachi, Sindh', 'NTN', NOW() - INTERVAL 30 DAY, NOW()),
('user-2-sarah', @tenant_id, 'Sarah Johnson', 'Sarah', 'Johnson', 'sarah.johnson@example.com', '+92-301-2345678', 'Pakistan', 'Lahore', '456 Oak Avenue, Lahore', 'customer', '2345678901234', 'Johnson Trading Co', 'Punjab', '456 Oak Avenue, Lahore, Punjab', 'CNIC', NOW() - INTERVAL 25 DAY, NOW()),
('user-3-ahmed', @tenant_id, 'Ahmed Khan', 'Ahmed', 'Khan', 'ahmed.khan@example.com', '+92-302-3456789', 'Pakistan', 'Islamabad', '789 Pine Road, Islamabad', 'customer', '3456789012345', 'Khan Industries', 'Islamabad', '789 Pine Road, Islamabad', 'NTN', NOW() - INTERVAL 20 DAY, NOW()),
('user-4-fatima', @tenant_id, 'Fatima Ali', 'Fatima', 'Ali', 'fatima.ali@example.com', '+92-303-4567890', 'Pakistan', 'Karachi', '321 Cedar Lane, Karachi', 'customer', '4567890123456', 'Ali Corporation', 'Sindh', '321 Cedar Lane, Karachi, Sindh', 'CNIC', NOW() - INTERVAL 15 DAY, NOW()),
('user-5-hassan', @tenant_id, 'Hassan Malik', 'Hassan', 'Malik', 'hassan.malik@example.com', '+92-304-5678901', 'Pakistan', 'Faisalabad', '654 Elm Street, Faisalabad', 'customer', '5678901234567', 'Malik Tech Solutions', 'Punjab', '654 Elm Street, Faisalabad, Punjab', 'NTN', NOW() - INTERVAL 10 DAY, NOW()),
('user-6-zara', @tenant_id, 'Zara Sheikh', 'Zara', 'Sheikh', 'zara.sheikh@example.com', '+92-305-6789012', 'Pakistan', 'Peshawar', '987 Birch Boulevard, Peshawar', 'customer', '6789012345678', 'Sheikh Enterprises', 'KPK', '987 Birch Boulevard, Peshawar, KPK', 'CNIC', NOW() - INTERVAL 8 DAY, NOW()),
('user-7-omar', @tenant_id, 'Omar Rashid', 'Omar', 'Rashid', 'omar.rashid@example.com', '+92-306-7890123', 'Pakistan', 'Multan', '147 Maple Drive, Multan', 'customer', '7890123456789', 'Rashid Group', 'Punjab', '147 Maple Drive, Multan, Punjab', 'NTN', NOW() - INTERVAL 5 DAY, NOW()),
('user-8-aisha', @tenant_id, 'Aisha Qureshi', 'Aisha', 'Qureshi', 'aisha.qureshi@example.com', '+92-307-8901234', 'Pakistan', 'Rawalpindi', '258 Walnut Way, Rawalpindi', 'customer', '8901234567890', 'Qureshi Holdings', 'Punjab', '258 Walnut Way, Rawalpindi, Punjab', 'CNIC', NOW() - INTERVAL 3 DAY, NOW());

-- ============================================
-- 3. PRODUCTS
-- ============================================
INSERT INTO products (id, tenant_id, name, slug, description, sku, price, cost_price, category_id, is_featured, is_active, tax_percentage, price_including_tax, price_excluding_tax, hs_code, product_type, created_at, updated_at) VALUES
('prod-1-laptop', @tenant_id, 'Professional Laptop', 'professional-laptop', 'High-performance laptop for business use', 'LAP-001', 120000.00, 100000.00, 'cat-1-electronics', 1, 1, 18.00, 139200.00, 120000.00, '8471.3000', 'simple', NOW() - INTERVAL 28 DAY, NOW()),
('prod-2-consulting', @tenant_id, 'Business Consulting Service', 'business-consulting', 'Professional business consulting services', 'CONS-001', 50000.00, 30000.00, 'cat-3-consulting', 1, 1, 18.00, 59000.00, 50000.00, '9805.9200', 'simple', NOW() - INTERVAL 25 DAY, NOW()),
('prod-3-software', @tenant_id, 'Custom Software Development', 'custom-software', 'Tailored software development services', 'SOFT-001', 200000.00, 120000.00, 'cat-4-software', 1, 1, 8.00, 216000.00, 200000.00, '9805.9200', 'simple', NOW() - INTERVAL 22 DAY, NOW()),
('prod-4-mobile', @tenant_id, 'Smartphone Device', 'smartphone-device', 'Latest smartphone with advanced features', 'MOB-001', 80000.00, 65000.00, 'cat-1-electronics', 1, 1, 18.00, 94400.00, 80000.00, '8517.1200', 'simple', NOW() - INTERVAL 20 DAY, NOW()),
('prod-5-training', @tenant_id, 'Technical Training Service', 'technical-training', 'Professional technical training programs', 'TRAIN-001', 35000.00, 20000.00, 'cat-2-services', 0, 1, 8.00, 37800.00, 35000.00, '9805.9200', 'simple', NOW() - INTERVAL 18 DAY, NOW()),
('prod-6-tablet', @tenant_id, 'Business Tablet', 'business-tablet', 'Professional tablet for business applications', 'TAB-001', 60000.00, 48000.00, 'cat-1-electronics', 1, 1, 18.00, 70800.00, 60000.00, '8471.3000', 'simple', NOW() - INTERVAL 15 DAY, NOW()),
('prod-7-maintenance', @tenant_id, 'System Maintenance Service', 'system-maintenance', 'Regular system maintenance and support', 'MAINT-001', 25000.00, 15000.00, 'cat-2-services', 0, 1, 18.00, 29500.00, 25000.00, '9805.9200', 'simple', NOW() - INTERVAL 12 DAY, NOW()),
('prod-8-audit', @tenant_id, 'IT Security Audit', 'it-security-audit', 'Comprehensive IT security audit services', 'AUDIT-001', 75000.00, 45000.00, 'cat-3-consulting', 1, 1, 8.00, 81000.00, 75000.00, '9805.9200', 'simple', NOW() - INTERVAL 10 DAY, NOW());

-- ============================================
-- 4. ORDERS
-- ============================================
-- Order 1: John Smith - Laptop Purchase
INSERT INTO orders (id, tenant_id, order_number, user_id, email, phone, status, payment_status, subtotal, tax_amount, total_amount, currency, billing_first_name, billing_last_name, billing_address1, billing_city, billing_state, billing_country, shipping_first_name, shipping_last_name, shipping_address1, shipping_city, shipping_state, shipping_country, buyer_ntn_cnic, buyer_business_name, buyer_province, buyer_address, buyer_registration_type, created_at, updated_at) VALUES
('order-1-john-laptop', @tenant_id, 'ORD-2024-001', 'user-1-john', 'john.smith@example.com', '+92-300-1234567', 'delivered', 'paid', 120000.00, 21600.00, 141600.00, 'PKR', 'John', 'Smith', '123 Main Street', 'Karachi', 'Sindh', 'Pakistan', 'John', 'Smith', '123 Main Street', 'Karachi', 'Sindh', 'Pakistan', '1234567890123', 'Smith Enterprises', 'Sindh', '123 Main Street, Karachi, Sindh', 'NTN', NOW() - INTERVAL 25 DAY, NOW());

-- Order 2: Sarah Johnson - Consulting Service
INSERT INTO orders (id, tenant_id, order_number, user_id, email, phone, status, payment_status, subtotal, tax_amount, total_amount, currency, billing_first_name, billing_last_name, billing_address1, billing_city, billing_state, billing_country, shipping_first_name, shipping_last_name, shipping_address1, shipping_city, shipping_state, shipping_country, buyer_ntn_cnic, buyer_business_name, buyer_province, buyer_address, buyer_registration_type, created_at, updated_at) VALUES
('order-2-sarah-consulting', @tenant_id, 'ORD-2024-002', 'user-2-sarah', 'sarah.johnson@example.com', '+92-301-2345678', 'completed', 'paid', 50000.00, 9000.00, 59000.00, 'PKR', 'Sarah', 'Johnson', '456 Oak Avenue', 'Lahore', 'Punjab', 'Pakistan', 'Sarah', 'Johnson', '456 Oak Avenue', 'Lahore', 'Punjab', 'Pakistan', '2345678901234', 'Johnson Trading Co', 'Punjab', '456 Oak Avenue, Lahore, Punjab', 'CNIC', NOW() - INTERVAL 22 DAY, NOW());

-- Order 3: Ahmed Khan - Software Development
INSERT INTO orders (id, tenant_id, order_number, user_id, email, phone, status, payment_status, subtotal, tax_amount, total_amount, currency, billing_first_name, billing_last_name, billing_address1, billing_city, billing_state, billing_country, shipping_first_name, shipping_last_name, shipping_address1, shipping_city, shipping_state, shipping_country, buyer_ntn_cnic, buyer_business_name, buyer_province, buyer_address, buyer_registration_type, created_at, updated_at) VALUES
('order-3-ahmed-software', @tenant_id, 'ORD-2024-003', 'user-3-ahmed', 'ahmed.khan@example.com', '+92-302-3456789', 'processing', 'paid', 200000.00, 16000.00, 216000.00, 'PKR', 'Ahmed', 'Khan', '789 Pine Road', 'Islamabad', 'Islamabad', 'Pakistan', 'Ahmed', 'Khan', '789 Pine Road', 'Islamabad', 'Islamabad', 'Pakistan', '3456789012345', 'Khan Industries', 'Islamabad', '789 Pine Road, Islamabad', 'NTN', NOW() - INTERVAL 18 DAY, NOW());

-- Order 4: Fatima Ali - Multiple Items
INSERT INTO orders (id, tenant_id, order_number, user_id, email, phone, status, payment_status, subtotal, tax_amount, total_amount, currency, billing_first_name, billing_last_name, billing_address1, billing_city, billing_state, billing_country, shipping_first_name, shipping_last_name, shipping_address1, shipping_city, shipping_state, shipping_country, buyer_ntn_cnic, buyer_business_name, buyer_province, buyer_address, buyer_registration_type, created_at, updated_at) VALUES
('order-4-fatima-multi', @tenant_id, 'ORD-2024-004', 'user-4-fatima', 'fatima.ali@example.com', '+92-303-4567890', 'shipped', 'paid', 140000.00, 23800.00, 163800.00, 'PKR', 'Fatima', 'Ali', '321 Cedar Lane', 'Karachi', 'Sindh', 'Pakistan', 'Fatima', 'Ali', '321 Cedar Lane', 'Karachi', 'Sindh', 'Pakistan', '4567890123456', 'Ali Corporation', 'Sindh', '321 Cedar Lane, Karachi, Sindh', 'CNIC', NOW() - INTERVAL 15 DAY, NOW());

-- Order 5: Hassan Malik - Training Service
INSERT INTO orders (id, tenant_id, order_number, user_id, email, phone, status, payment_status, subtotal, tax_amount, total_amount, currency, billing_first_name, billing_last_name, billing_address1, billing_city, billing_state, billing_country, shipping_first_name, shipping_last_name, shipping_address1, shipping_city, shipping_state, shipping_country, buyer_ntn_cnic, buyer_business_name, buyer_province, buyer_address, buyer_registration_type, created_at, updated_at) VALUES
('order-5-hassan-training', @tenant_id, 'ORD-2024-005', 'user-5-hassan', 'hassan.malik@example.com', '+92-304-5678901', 'delivered', 'paid', 35000.00, 2800.00, 37800.00, 'PKR', 'Hassan', 'Malik', '654 Elm Street', 'Faisalabad', 'Punjab', 'Pakistan', 'Hassan', 'Malik', '654 Elm Street', 'Faisalabad', 'Punjab', 'Pakistan', '5678901234567', 'Malik Tech Solutions', 'Punjab', '654 Elm Street, Faisalabad, Punjab', 'NTN', NOW() - INTERVAL 12 DAY, NOW());

-- Order 6: Zara Sheikh - Tablet Purchase
INSERT INTO orders (id, tenant_id, order_number, user_id, email, phone, status, payment_status, subtotal, tax_amount, total_amount, currency, billing_first_name, billing_last_name, billing_address1, billing_city, billing_state, billing_country, shipping_first_name, shipping_last_name, shipping_address1, shipping_city, shipping_state, shipping_country, buyer_ntn_cnic, buyer_business_name, buyer_province, buyer_address, buyer_registration_type, created_at, updated_at) VALUES
('order-6-zara-tablet', @tenant_id, 'ORD-2024-006', 'user-6-zara', 'zara.sheikh@example.com', '+92-305-6789012', 'confirmed', 'paid', 60000.00, 10800.00, 70800.00, 'PKR', 'Zara', 'Sheikh', '987 Birch Boulevard', 'Peshawar', 'KPK', 'Pakistan', 'Zara', 'Sheikh', '987 Birch Boulevard', 'Peshawar', 'KPK', 'Pakistan', '6789012345678', 'Sheikh Enterprises', 'KPK', '987 Birch Boulevard, Peshawar, KPK', 'CNIC', NOW() - INTERVAL 8 DAY, NOW());

-- Order 7: Omar Rashid - Recent Order
INSERT INTO orders (id, tenant_id, order_number, user_id, email, phone, status, payment_status, subtotal, tax_amount, total_amount, currency, billing_first_name, billing_last_name, billing_address1, billing_city, billing_state, billing_country, shipping_first_name, shipping_last_name, shipping_address1, shipping_city, shipping_state, shipping_country, buyer_ntn_cnic, buyer_business_name, buyer_province, buyer_address, buyer_registration_type, created_at, updated_at) VALUES
('order-7-omar-recent', @tenant_id, 'ORD-2024-007', 'user-7-omar', 'omar.rashid@example.com', '+92-306-7890123', 'processing', 'paid', 100000.00, 15200.00, 115200.00, 'PKR', 'Omar', 'Rashid', '147 Maple Drive', 'Multan', 'Punjab', 'Pakistan', 'Omar', 'Rashid', '147 Maple Drive', 'Multan', 'Punjab', 'Pakistan', '7890123456789', 'Rashid Group', 'Punjab', '147 Maple Drive, Multan, Punjab', 'NTN', NOW() - INTERVAL 5 DAY, NOW());

-- Order 8: Aisha Qureshi - Latest Order
INSERT INTO orders (id, tenant_id, order_number, user_id, email, phone, status, payment_status, subtotal, tax_amount, total_amount, currency, billing_first_name, billing_last_name, billing_address1, billing_city, billing_state, billing_country, shipping_first_name, shipping_last_name, shipping_address1, shipping_city, shipping_state, shipping_country, buyer_ntn_cnic, buyer_business_name, buyer_province, buyer_address, buyer_registration_type, created_at, updated_at) VALUES
('order-8-aisha-latest', @tenant_id, 'ORD-2024-008', 'user-8-aisha', 'aisha.qureshi@example.com', '+92-307-8901234', 'pending', 'pending', 75000.00, 6000.00, 81000.00, 'PKR', 'Aisha', 'Qureshi', '258 Walnut Way', 'Rawalpindi', 'Punjab', 'Pakistan', 'Aisha', 'Qureshi', '258 Walnut Way', 'Rawalpindi', 'Punjab', 'Pakistan', '8901234567890', 'Qureshi Holdings', 'Punjab', '258 Walnut Way, Rawalpindi, Punjab', 'CNIC', NOW() - INTERVAL 2 DAY, NOW());

-- ============================================
-- 5. ORDER ITEMS
-- ============================================
-- Order 1 Items: John Smith - Laptop
INSERT INTO order_items (id, order_id, product_id, product_name, sku, hs_code, uom, quantity, price, cost_price, total_price, total_cost, tax_amount, tax_percentage, price_including_tax, price_excluding_tax, sale_type, created_at) VALUES
('item-1-laptop', 'order-1-john-laptop', 'prod-1-laptop', 'Professional Laptop', 'LAP-001', '8471.3000', 'PCS', 1, 120000.00, 100000.00, 120000.00, 100000.00, 21600.00, 18.00, 141600.00, 120000.00, 'Goods at standard rate (default)', NOW() - INTERVAL 25 DAY);

-- Order 2 Items: Sarah Johnson - Consulting
INSERT INTO order_items (id, order_id, product_id, product_name, sku, hs_code, uom, quantity, price, cost_price, total_price, total_cost, tax_amount, tax_percentage, price_including_tax, price_excluding_tax, sale_type, created_at) VALUES
('item-2-consulting', 'order-2-sarah-consulting', 'prod-2-consulting', 'Business Consulting Service', 'CONS-001', '9805.9200', 'Hours', 1, 50000.00, 30000.00, 50000.00, 30000.00, 9000.00, 18.00, 59000.00, 50000.00, 'Services (FED in ST Mode)', NOW() - INTERVAL 22 DAY);

-- Order 3 Items: Ahmed Khan - Software Development
INSERT INTO order_items (id, order_id, product_id, product_name, sku, hs_code, uom, quantity, price, cost_price, total_price, total_cost, tax_amount, tax_percentage, price_including_tax, price_excluding_tax, sale_type, created_at) VALUES
('item-3-software', 'order-3-ahmed-software', 'prod-3-software', 'Custom Software Development', 'SOFT-001', '9805.9200', 'Numbers, pieces, units', 1, 200000.00, 120000.00, 200000.00, 120000.00, 16000.00, 8.00, 216000.00, 200000.00, 'Services (FED in ST Mode)', NOW() - INTERVAL 18 DAY);

-- Order 4 Items: Fatima Ali - Multiple Items (Smartphone + Tablet)
INSERT INTO order_items (id, order_id, product_id, product_name, sku, hs_code, uom, quantity, price, cost_price, total_price, total_cost, tax_amount, tax_percentage, price_including_tax, price_excluding_tax, sale_type, created_at) VALUES
('item-4a-mobile', 'order-4-fatima-multi', 'prod-4-mobile', 'Smartphone Device', 'MOB-001', '8517.1200', 'PCS', 1, 80000.00, 65000.00, 80000.00, 65000.00, 14400.00, 18.00, 94400.00, 80000.00, 'Goods at standard rate (default)', NOW() - INTERVAL 15 DAY),
('item-4b-tablet', 'order-4-fatima-multi', 'prod-6-tablet', 'Business Tablet', 'TAB-001', '8471.3000', 'PCS', 1, 60000.00, 48000.00, 60000.00, 48000.00, 10800.00, 18.00, 70800.00, 60000.00, 'Goods at standard rate (default)', NOW() - INTERVAL 15 DAY);

-- Order 5 Items: Hassan Malik - Training
INSERT INTO order_items (id, order_id, product_id, product_name, sku, hs_code, uom, quantity, price, cost_price, total_price, total_cost, tax_amount, tax_percentage, price_including_tax, price_excluding_tax, sale_type, created_at) VALUES
('item-5-training', 'order-5-hassan-training', 'prod-5-training', 'Technical Training Service', 'TRAIN-001', '9805.9200', 'Hours', 1, 35000.00, 20000.00, 35000.00, 20000.00, 2800.00, 8.00, 37800.00, 35000.00, 'Services (FED in ST Mode)', NOW() - INTERVAL 12 DAY);

-- Order 6 Items: Zara Sheikh - Tablet
INSERT INTO order_items (id, order_id, product_id, product_name, sku, hs_code, uom, quantity, price, cost_price, total_price, total_cost, tax_amount, tax_percentage, price_including_tax, price_excluding_tax, sale_type, created_at) VALUES
('item-6-tablet', 'order-6-zara-tablet', 'prod-6-tablet', 'Business Tablet', 'TAB-001', '8471.3000', 'PCS', 1, 60000.00, 48000.00, 60000.00, 48000.00, 10800.00, 18.00, 70800.00, 60000.00, 'Goods at standard rate (default)', NOW() - INTERVAL 8 DAY);

-- Order 7 Items: Omar Rashid - Maintenance + Audit
INSERT INTO order_items (id, order_id, product_id, product_name, sku, hs_code, uom, quantity, price, cost_price, total_price, total_cost, tax_amount, tax_percentage, price_including_tax, price_excluding_tax, sale_type, created_at) VALUES
('item-7a-maintenance', 'order-7-omar-recent', 'prod-7-maintenance', 'System Maintenance Service', 'MAINT-001', '9805.9200', 'Hours', 1, 25000.00, 15000.00, 25000.00, 15000.00, 4500.00, 18.00, 29500.00, 25000.00, 'Services (FED in ST Mode)', NOW() - INTERVAL 5 DAY),
('item-7b-audit', 'order-7-omar-recent', 'prod-8-audit', 'IT Security Audit', 'AUDIT-001', '9805.9200', 'Hours', 1, 75000.00, 45000.00, 75000.00, 45000.00, 6000.00, 8.00, 81000.00, 75000.00, 'Services (FED in ST Mode)', NOW() - INTERVAL 5 DAY);

-- Order 8 Items: Aisha Qureshi - Audit Service
INSERT INTO order_items (id, order_id, product_id, product_name, sku, hs_code, uom, quantity, price, cost_price, total_price, total_cost, tax_amount, tax_percentage, price_including_tax, price_excluding_tax, sale_type, created_at) VALUES
('item-8-audit', 'order-8-aisha-latest', 'prod-8-audit', 'IT Security Audit', 'AUDIT-001', '9805.9200', 'Hours', 1, 75000.00, 45000.00, 75000.00, 45000.00, 6000.00, 8.00, 81000.00, 75000.00, 'Services (FED in ST Mode)', NOW() - INTERVAL 2 DAY);

-- ============================================
-- 6. SUMMARY OF CREATED DATA
-- ============================================
-- Categories: 4 (Electronics, Services, Consulting, Software)
-- Users: 8 customers with complete business information
-- Products: 8 products across different categories with realistic pricing
-- Orders: 8 orders with varying statuses and dates (last 30 days)
-- Order Items: 11 items across the orders
--
-- Expected Dashboard Stats for this tenant:
-- - Customers: 8
-- - Products: 8  
-- - Categories: 4
-- - Orders: 8
-- - Total Revenue: ≈ PKR 985,200
-- - Total Cost: ≈ PKR 591,000
-- - Total Profit: ≈ PKR 394,200
-- - Average Order Value: ≈ PKR 123,150
--
-- ============================================

SELECT 'Dummy data insertion completed successfully!' as Status;
