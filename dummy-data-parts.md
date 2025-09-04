# Dummy Data - Simple Queries for phpMyAdmin

## Part 1: Categories (4 records)

```sql
INSERT INTO categories (id, tenant_id, name, slug, description, is_featured, is_active, created_at, updated_at) VALUES
('cat-1-electronics', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'Electronics', 'electronics', 'Electronic devices and gadgets', 1, 1, NOW(), NOW()),
('cat-2-services', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'Services', 'services', 'Professional services', 1, 1, NOW(), NOW()),
('cat-3-consulting', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'Consulting', 'consulting', 'Business consulting services', 0, 1, NOW(), NOW()),
('cat-4-software', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'Software', 'software', 'Software development services', 1, 1, NOW(), NOW());
```

## Part 2: Users/Customers (First 4 users)

```sql
INSERT INTO user (id, tenant_id, name, first_name, last_name, email, phone, country, city, address, user_type, buyer_ntn_cnic, buyer_business_name, buyer_province, buyer_address, buyer_registration_type, created_at, updated_at) VALUES
('user-1-john', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'John Smith', 'John', 'Smith', 'john.smith@example.com', '+92-300-1234567', 'Pakistan', 'Karachi', '123 Main Street, Karachi', 'customer', '1234567890123', 'Smith Enterprises', 'Sindh', '123 Main Street, Karachi, Sindh', 'NTN', DATE_SUB(NOW(), INTERVAL 30 DAY), NOW()),
('user-2-sarah', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'Sarah Johnson', 'Sarah', 'Johnson', 'sarah.johnson@example.com', '+92-301-2345678', 'Pakistan', 'Lahore', '456 Oak Avenue, Lahore', 'customer', '2345678901234', 'Johnson Trading Co', 'Punjab', '456 Oak Avenue, Lahore, Punjab', 'CNIC', DATE_SUB(NOW(), INTERVAL 25 DAY), NOW()),
('user-3-ahmed', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'Ahmed Khan', 'Ahmed', 'Khan', 'ahmed.khan@example.com', '+92-302-3456789', 'Pakistan', 'Islamabad', '789 Pine Road, Islamabad', 'customer', '3456789012345', 'Khan Industries', 'Islamabad', '789 Pine Road, Islamabad', 'NTN', DATE_SUB(NOW(), INTERVAL 20 DAY), NOW()),
('user-4-fatima', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'Fatima Ali', 'Fatima', 'Ali', 'fatima.ali@example.com', '+92-303-4567890', 'Pakistan', 'Karachi', '321 Cedar Lane, Karachi', 'customer', '4567890123456', 'Ali Corporation', 'Sindh', '321 Cedar Lane, Karachi, Sindh', 'CNIC', DATE_SUB(NOW(), INTERVAL 15 DAY), NOW());
```

## Part 3: Users/Customers (Last 4 users)

```sql
INSERT INTO user (id, tenant_id, name, first_name, last_name, email, phone, country, city, address, user_type, buyer_ntn_cnic, buyer_business_name, buyer_province, buyer_address, buyer_registration_type, created_at, updated_at) VALUES
('user-5-hassan', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'Hassan Malik', 'Hassan', 'Malik', 'hassan.malik@example.com', '+92-304-5678901', 'Pakistan', 'Faisalabad', '654 Elm Street, Faisalabad', 'customer', '5678901234567', 'Malik Tech Solutions', 'Punjab', '654 Elm Street, Faisalabad, Punjab', 'NTN', DATE_SUB(NOW(), INTERVAL 10 DAY), NOW()),
('user-6-zara', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'Zara Sheikh', 'Zara', 'Sheikh', 'zara.sheikh@example.com', '+92-305-6789012', 'Pakistan', 'Peshawar', '987 Birch Boulevard, Peshawar', 'customer', '6789012345678', 'Sheikh Enterprises', 'KPK', '987 Birch Boulevard, Peshawar, KPK', 'CNIC', DATE_SUB(NOW(), INTERVAL 8 DAY), NOW()),
('user-7-omar', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'Omar Rashid', 'Omar', 'Rashid', 'omar.rashid@example.com', '+92-306-7890123', 'Pakistan', 'Multan', '147 Maple Drive, Multan', 'customer', '7890123456789', 'Rashid Group', 'Punjab', '147 Maple Drive, Multan, Punjab', 'NTN', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
('user-8-aisha', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'Aisha Qureshi', 'Aisha', 'Qureshi', 'aisha.qureshi@example.com', '+92-307-8901234', 'Pakistan', 'Rawalpindi', '258 Walnut Way, Rawalpindi', 'customer', '8901234567890', 'Qureshi Holdings', 'Punjab', '258 Walnut Way, Rawalpindi, Punjab', 'CNIC', DATE_SUB(NOW(), INTERVAL 3 DAY), NOW());
```

## Part 4: Products (First 4 products)

```sql
INSERT INTO products (id, tenant_id, name, slug, description, sku, price, cost_price, category_id, is_featured, is_active, tax_percentage, price_including_tax, price_excluding_tax, hs_code, product_type, created_at, updated_at) VALUES
('prod-1-laptop', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'Professional Laptop', 'professional-laptop', 'High-performance laptop for business use', 'LAP-001', 120000.00, 100000.00, 'cat-1-electronics', 1, 1, 18.00, 139200.00, 120000.00, '8471.3000', 'simple', DATE_SUB(NOW(), INTERVAL 28 DAY), NOW()),
('prod-2-consulting', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'Business Consulting Service', 'business-consulting', 'Professional business consulting services', 'CONS-001', 50000.00, 30000.00, 'cat-3-consulting', 1, 1, 18.00, 59000.00, 50000.00, '9805.9200', 'simple', DATE_SUB(NOW(), INTERVAL 25 DAY), NOW()),
('prod-3-software', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'Custom Software Development', 'custom-software', 'Tailored software development services', 'SOFT-001', 200000.00, 120000.00, 'cat-4-software', 1, 1, 8.00, 216000.00, 200000.00, '9805.9200', 'simple', DATE_SUB(NOW(), INTERVAL 22 DAY), NOW()),
('prod-4-mobile', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'Smartphone Device', 'smartphone-device', 'Latest smartphone with advanced features', 'MOB-001', 80000.00, 65000.00, 'cat-1-electronics', 1, 1, 18.00, 94400.00, 80000.00, '8517.1200', 'simple', DATE_SUB(NOW(), INTERVAL 20 DAY), NOW());
```

## Part 5: Products (Last 4 products)

```sql
INSERT INTO products (id, tenant_id, name, slug, description, sku, price, cost_price, category_id, is_featured, is_active, tax_percentage, price_including_tax, price_excluding_tax, hs_code, product_type, created_at, updated_at) VALUES
('prod-5-training', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'Technical Training Service', 'technical-training', 'Professional technical training programs', 'TRAIN-001', 35000.00, 20000.00, 'cat-2-services', 0, 1, 8.00, 37800.00, 35000.00, '9805.9200', 'simple', DATE_SUB(NOW(), INTERVAL 18 DAY), NOW()),
('prod-6-tablet', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'Business Tablet', 'business-tablet', 'Professional tablet for business applications', 'TAB-001', 60000.00, 48000.00, 'cat-1-electronics', 1, 1, 18.00, 70800.00, 60000.00, '8471.3000', 'simple', DATE_SUB(NOW(), INTERVAL 15 DAY), NOW()),
('prod-7-maintenance', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'System Maintenance Service', 'system-maintenance', 'Regular system maintenance and support', 'MAINT-001', 25000.00, 15000.00, 'cat-2-services', 0, 1, 18.00, 29500.00, 25000.00, '9805.9200', 'simple', DATE_SUB(NOW(), INTERVAL 12 DAY), NOW()),
('prod-8-audit', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'IT Security Audit', 'it-security-audit', 'Comprehensive IT security audit services', 'AUDIT-001', 75000.00, 45000.00, 'cat-3-consulting', 1, 1, 8.00, 81000.00, 75000.00, '9805.9200', 'simple', DATE_SUB(NOW(), INTERVAL 10 DAY), NOW());
```

## Part 6: Orders (First 4 orders)

```sql
INSERT INTO orders (id, tenant_id, order_number, user_id, email, phone, status, payment_status, subtotal, tax_amount, total_amount, currency, billing_first_name, billing_last_name, billing_address1, billing_city, billing_state, billing_country, shipping_first_name, shipping_last_name, shipping_address1, shipping_city, shipping_state, shipping_country, buyer_ntn_cnic, buyer_business_name, buyer_province, buyer_address, buyer_registration_type, created_at, updated_at) VALUES
('order-1-john-laptop', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'ORD-2024-001', 'user-1-john', 'john.smith@example.com', '+92-300-1234567', 'delivered', 'paid', 120000.00, 21600.00, 141600.00, 'PKR', 'John', 'Smith', '123 Main Street', 'Karachi', 'Sindh', 'Pakistan', 'John', 'Smith', '123 Main Street', 'Karachi', 'Sindh', 'Pakistan', '1234567890123', 'Smith Enterprises', 'Sindh', '123 Main Street, Karachi, Sindh', 'NTN', DATE_SUB(NOW(), INTERVAL 25 DAY), NOW()),
('order-2-sarah-consulting', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'ORD-2024-002', 'user-2-sarah', 'sarah.johnson@example.com', '+92-301-2345678', 'completed', 'paid', 50000.00, 9000.00, 59000.00, 'PKR', 'Sarah', 'Johnson', '456 Oak Avenue', 'Lahore', 'Punjab', 'Pakistan', 'Sarah', 'Johnson', '456 Oak Avenue', 'Lahore', 'Punjab', 'Pakistan', '2345678901234', 'Johnson Trading Co', 'Punjab', '456 Oak Avenue, Lahore, Punjab', 'CNIC', DATE_SUB(NOW(), INTERVAL 22 DAY), NOW()),
('order-3-ahmed-software', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'ORD-2024-003', 'user-3-ahmed', 'ahmed.khan@example.com', '+92-302-3456789', 'processing', 'paid', 200000.00, 16000.00, 216000.00, 'PKR', 'Ahmed', 'Khan', '789 Pine Road', 'Islamabad', 'Islamabad', 'Pakistan', 'Ahmed', 'Khan', '789 Pine Road', 'Islamabad', 'Islamabad', 'Pakistan', '3456789012345', 'Khan Industries', 'Islamabad', '789 Pine Road, Islamabad', 'NTN', DATE_SUB(NOW(), INTERVAL 18 DAY), NOW()),
('order-4-fatima-multi', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'ORD-2024-004', 'user-4-fatima', 'fatima.ali@example.com', '+92-303-4567890', 'shipped', 'paid', 140000.00, 23800.00, 163800.00, 'PKR', 'Fatima', 'Ali', '321 Cedar Lane', 'Karachi', 'Sindh', 'Pakistan', 'Fatima', 'Ali', '321 Cedar Lane', 'Karachi', 'Sindh', 'Pakistan', '4567890123456', 'Ali Corporation', 'Sindh', '321 Cedar Lane, Karachi, Sindh', 'CNIC', DATE_SUB(NOW(), INTERVAL 15 DAY), NOW());
```

## Part 7: Orders (Last 4 orders)

```sql
INSERT INTO orders (id, tenant_id, order_number, user_id, email, phone, status, payment_status, subtotal, tax_amount, total_amount, currency, billing_first_name, billing_last_name, billing_address1, billing_city, billing_state, billing_country, shipping_first_name, shipping_last_name, shipping_address1, shipping_city, shipping_state, shipping_country, buyer_ntn_cnic, buyer_business_name, buyer_province, buyer_address, buyer_registration_type, created_at, updated_at) VALUES
('order-5-hassan-training', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'ORD-2024-005', 'user-5-hassan', 'hassan.malik@example.com', '+92-304-5678901', 'delivered', 'paid', 35000.00, 2800.00, 37800.00, 'PKR', 'Hassan', 'Malik', '654 Elm Street', 'Faisalabad', 'Punjab', 'Pakistan', 'Hassan', 'Malik', '654 Elm Street', 'Faisalabad', 'Punjab', 'Pakistan', '5678901234567', 'Malik Tech Solutions', 'Punjab', '654 Elm Street, Faisalabad, Punjab', 'NTN', DATE_SUB(NOW(), INTERVAL 12 DAY), NOW()),
('order-6-zara-tablet', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'ORD-2024-006', 'user-6-zara', 'zara.sheikh@example.com', '+92-305-6789012', 'confirmed', 'paid', 60000.00, 10800.00, 70800.00, 'PKR', 'Zara', 'Sheikh', '987 Birch Boulevard', 'Peshawar', 'KPK', 'Pakistan', 'Zara', 'Sheikh', '987 Birch Boulevard', 'Peshawar', 'KPK', 'Pakistan', '6789012345678', 'Sheikh Enterprises', 'KPK', '987 Birch Boulevard, Peshawar, KPK', 'CNIC', DATE_SUB(NOW(), INTERVAL 8 DAY), NOW()),
('order-7-omar-recent', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'ORD-2024-007', 'user-7-omar', 'omar.rashid@example.com', '+92-306-7890123', 'processing', 'paid', 100000.00, 15200.00, 115200.00, 'PKR', 'Omar', 'Rashid', '147 Maple Drive', 'Multan', 'Punjab', 'Pakistan', 'Omar', 'Rashid', '147 Maple Drive', 'Multan', 'Punjab', 'Pakistan', '7890123456789', 'Rashid Group', 'Punjab', '147 Maple Drive, Multan, Punjab', 'NTN', DATE_SUB(NOW(), INTERVAL 5 DAY), NOW()),
('order-8-aisha-latest', '1f53e212-4ab3-4dfb-ab16-5fa966b98910', 'ORD-2024-008', 'user-8-aisha', 'aisha.qureshi@example.com', '+92-307-8901234', 'pending', 'pending', 75000.00, 6000.00, 81000.00, 'PKR', 'Aisha', 'Qureshi', '258 Walnut Way', 'Rawalpindi', 'Punjab', 'Pakistan', 'Aisha', 'Qureshi', '258 Walnut Way', 'Rawalpindi', 'Punjab', 'Pakistan', '8901234567890', 'Qureshi Holdings', 'Punjab', '258 Walnut Way, Rawalpindi, Punjab', 'CNIC', DATE_SUB(NOW(), INTERVAL 2 DAY), NOW());
```

## Part 8: Order Items (First batch)

```sql
INSERT INTO order_items (id, order_id, product_id, product_name, sku, hs_code, uom, quantity, price, cost_price, total_price, total_cost, tax_amount, tax_percentage, price_including_tax, price_excluding_tax, sale_type, created_at) VALUES
('item-1-laptop', 'order-1-john-laptop', 'prod-1-laptop', 'Professional Laptop', 'LAP-001', '8471.3000', 'PCS', 1, 120000.00, 100000.00, 120000.00, 100000.00, 21600.00, 18.00, 141600.00, 120000.00, 'Goods at standard rate (default)', DATE_SUB(NOW(), INTERVAL 25 DAY)),
('item-2-consulting', 'order-2-sarah-consulting', 'prod-2-consulting', 'Business Consulting Service', 'CONS-001', '9805.9200', 'Hours', 1, 50000.00, 30000.00, 50000.00, 30000.00, 9000.00, 18.00, 59000.00, 50000.00, 'Services (FED in ST Mode)', DATE_SUB(NOW(), INTERVAL 22 DAY)),
('item-3-software', 'order-3-ahmed-software', 'prod-3-software', 'Custom Software Development', 'SOFT-001', '9805.9200', 'Numbers, pieces, units', 1, 200000.00, 120000.00, 200000.00, 120000.00, 16000.00, 8.00, 216000.00, 200000.00, 'Services (FED in ST Mode)', DATE_SUB(NOW(), INTERVAL 18 DAY));
```

## Part 9: Order Items (Second batch)

```sql
INSERT INTO order_items (id, order_id, product_id, product_name, sku, hs_code, uom, quantity, price, cost_price, total_price, total_cost, tax_amount, tax_percentage, price_including_tax, price_excluding_tax, sale_type, created_at) VALUES
('item-4a-mobile', 'order-4-fatima-multi', 'prod-4-mobile', 'Smartphone Device', 'MOB-001', '8517.1200', 'PCS', 1, 80000.00, 65000.00, 80000.00, 65000.00, 14400.00, 18.00, 94400.00, 80000.00, 'Goods at standard rate (default)', DATE_SUB(NOW(), INTERVAL 15 DAY)),
('item-4b-tablet', 'order-4-fatima-multi', 'prod-6-tablet', 'Business Tablet', 'TAB-001', '8471.3000', 'PCS', 1, 60000.00, 48000.00, 60000.00, 48000.00, 10800.00, 18.00, 70800.00, 60000.00, 'Goods at standard rate (default)', DATE_SUB(NOW(), INTERVAL 15 DAY)),
('item-5-training', 'order-5-hassan-training', 'prod-5-training', 'Technical Training Service', 'TRAIN-001', '9805.9200', 'Hours', 1, 35000.00, 20000.00, 35000.00, 20000.00, 2800.00, 8.00, 37800.00, 35000.00, 'Services (FED in ST Mode)', DATE_SUB(NOW(), INTERVAL 12 DAY)),
('item-6-tablet', 'order-6-zara-tablet', 'prod-6-tablet', 'Business Tablet', 'TAB-001', '8471.3000', 'PCS', 1, 60000.00, 48000.00, 60000.00, 48000.00, 10800.00, 18.00, 70800.00, 60000.00, 'Goods at standard rate (default)', DATE_SUB(NOW(), INTERVAL 8 DAY));
```

## Part 10: Order Items (Final batch)

```sql
INSERT INTO order_items (id, order_id, product_id, product_name, sku, hs_code, uom, quantity, price, cost_price, total_price, total_cost, tax_amount, tax_percentage, price_including_tax, price_excluding_tax, sale_type, created_at) VALUES
('item-7a-maintenance', 'order-7-omar-recent', 'prod-7-maintenance', 'System Maintenance Service', 'MAINT-001', '9805.9200', 'Hours', 1, 25000.00, 15000.00, 25000.00, 15000.00, 4500.00, 18.00, 29500.00, 25000.00, 'Services (FED in ST Mode)', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('item-7b-audit', 'order-7-omar-recent', 'prod-8-audit', 'IT Security Audit', 'AUDIT-001', '9805.9200', 'Hours', 1, 75000.00, 45000.00, 75000.00, 45000.00, 6000.00, 8.00, 81000.00, 75000.00, 'Services (FED in ST Mode)', DATE_SUB(NOW(), INTERVAL 5 DAY)),
('item-8-audit', 'order-8-aisha-latest', 'prod-8-audit', 'IT Security Audit', 'AUDIT-001', '9805.9200', 'Hours', 1, 75000.00, 45000.00, 75000.00, 45000.00, 6000.00, 8.00, 81000.00, 75000.00, 'Services (FED in ST Mode)', DATE_SUB(NOW(), INTERVAL 2 DAY));
```

## 📋 **How to Use in phpMyAdmin:**

1. **Open phpMyAdmin** and select your database
2. **Go to SQL tab**
3. **Copy and paste each part one by one** (start with Part 1, then Part 2, etc.)
4. **Click "Go" after each part**
5. **Wait for success message** before proceeding to next part

## ✅ **Verification Query:**
After all parts are inserted, run this to verify:

```sql
SELECT 
    'Categories' as Type, COUNT(*) as Count 
FROM categories 
WHERE tenant_id = '1f53e212-4ab3-4dfb-ab16-5fa966b98910'
UNION ALL
SELECT 
    'Users' as Type, COUNT(*) as Count 
FROM user 
WHERE tenant_id = '1f53e212-4ab3-4dfb-ab16-5fa966b98910'
UNION ALL
SELECT 
    'Products' as Type, COUNT(*) as Count 
FROM products 
WHERE tenant_id = '1f53e212-4ab3-4dfb-ab16-5fa966b98910'
UNION ALL
SELECT 
    'Orders' as Type, COUNT(*) as Count 
FROM orders 
WHERE tenant_id = '1f53e212-4ab3-4dfb-ab16-5fa966b98910';
```

Expected results: Categories=4, Users=8, Products=8, Orders=8

## 🎯 **Order of Execution:**
1. Part 1: Categories (required first)
2. Part 2-3: Users 
3. Part 4-5: Products (requires categories)
4. Part 6-7: Orders (requires users)
5. Part 8-10: Order Items (requires orders and products)
