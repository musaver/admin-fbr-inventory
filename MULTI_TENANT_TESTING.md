# Multi-Tenant Testing Guide

This guide helps you test the multi-tenant functionality to ensure proper data isolation between tenants.

## 🎯 Test Scenarios

We need to verify that:
1. **Admin Login**: Each tenant admin can only login to their own tenant
2. **Data Isolation**: Each tenant only sees their own products, customers, orders
3. **API Security**: API endpoints properly filter by tenant ID
4. **Cross-Tenant Security**: Tenant A cannot access Tenant B's data

## 🏢 Test Tenants Created

✅ **Tenant 1 newd: Acme Electronics**
- Subdomain: `acme-electronics`
- Admin Email: `admin@acme-electronics.com`
- Password: `admin123`
- Plan: Premium
- ID: `1322dcd9-b23c-40b9-a918-b6b8b990e011`

✅ **Tenant 2: Beta Retail Co**
- Subdomain: `beta-retail`  
- Admin Email: `admin@beta-retail.com`
- Password: `admin123`
- Plan: Basic
- ID: `cb51f4b3-955c-4bfe-84db-a8edfac2a4ec`

## 🌐 Testing Methods

### Method 1: Using /etc/hosts (Recommended for local testing)

Add these lines to your `/etc/hosts` file:
```
127.0.0.1 acme-electronics.localhost
127.0.0.1 beta-retail.localhost
```

Then access:
- Acme Electronics: `http://acme-electronics.localhost:3000`
- Beta Retail: `http://beta-retail.localhost:3000`

### Method 2: Using ngrok (For remote testing)

1. Start ngrok: `npx ngrok http 3000`
2. Get your ngrok URL (e.g., `abc123.ngrok.io`)
3. Access tenants:
   - Acme Electronics: `http://acme-electronics.abc123.ngrok.io`
   - Beta Retail: `http://beta-retail.abc123.ngrok.io`

### Method 3: Manual Header Testing (For API testing)

Use tools like Postman or curl with custom headers:
```bash
curl -H "Host: acme-electronics.localhost" http://localhost:3000/api/products
```

## 🧪 Test Cases

### 1. Admin Login Test

**Steps:**
1. Go to `http://acme-electronics.localhost:3000/login`
2. Login with `admin@acme-electronics.com` / `admin123`
3. Verify you're redirected to Acme's dashboard
4. Repeat for Beta Retail tenant

**Expected Result:**
- ✅ Each admin can only login to their own tenant
- ✅ Login attempts with wrong tenant should fail

### 2. Product Isolation Test

**Steps:**
1. Login to Acme Electronics tenant
2. Go to Products page
3. Add a product: "iPhone 15 Pro" in "Electronics" category
4. Login to Beta Retail tenant  
5. Go to Products page
6. Add a product: "Cotton T-Shirt" in "Clothing" category
7. Switch back to Acme tenant and verify you only see iPhone

**Expected Result:**
- ✅ Acme should only see "iPhone 15 Pro"
- ✅ Beta should only see "Cotton T-Shirt"
- ❌ Cross-tenant products should NOT be visible

### 3. Customer Isolation Test

**Steps:**
1. In Acme tenant, add customer: "Alice Cooper"
2. In Beta tenant, add customer: "Bob Wilson"  
3. Verify each tenant only sees their own customers

**Expected Result:**
- ✅ Each tenant sees only their own customers
- ❌ Cross-tenant customers should NOT be visible

### 4. Order Isolation Test

**Steps:**
1. Create orders in each tenant
2. Verify orders are isolated by tenant
3. Check order numbers don't conflict

**Expected Result:**
- ✅ Each tenant sees only their own orders
- ✅ Order numbering is isolated per tenant

### 5. API Security Test

**Manual API Testing:**

```bash
# Test products API for Acme Electronics
curl -H "Host: acme-electronics.localhost" \
     -H "Content-Type: application/json" \
     http://localhost:3000/api/products

# Test products API for Beta Retail  
curl -H "Host: beta-retail.localhost" \
     -H "Content-Type: application/json" \
     http://localhost:3000/api/products
```

**Expected Result:**
- ✅ Each API call returns only tenant-specific data
- ✅ No cross-tenant data leakage

## 🔍 Database Verification

Run these SQL queries to verify data isolation:

```sql
-- Check tenants
SELECT id, name, slug, status FROM tenants;

-- Check admin users by tenant
SELECT tenantId, name, email FROM adminUsers ORDER BY tenantId;

-- Check products by tenant (if any exist)
SELECT tenantId, name, sku FROM products ORDER BY tenantId;

-- Check users/customers by tenant (if any exist)  
SELECT tenantId, name, email FROM user ORDER BY tenantId;
```

## 🚨 Security Checks

### Critical Security Tests:

1. **JWT Token Validation**: Ensure tokens are tenant-specific
2. **API Route Protection**: All API routes must check tenant context
3. **Database Queries**: All queries must include `WHERE tenantId = ?`
4. **Session Management**: Sessions must be isolated by tenant

### Red Flags to Watch For:

❌ **Data Leakage**: Seeing other tenant's data  
❌ **Cross-Login**: Logging into wrong tenant with credentials  
❌ **API Bypass**: Accessing data without proper tenant filtering  
❌ **URL Manipulation**: Changing subdomain to access other tenant  

## 🛠 Automated Test Script

Create test data for both tenants:

```javascript
// Run this in browser console after logging in to each tenant
async function createTestData(tenantName) {
  console.log(`Creating test data for ${tenantName}...`);
  
  // Add test category
  const categoryResponse = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: tenantName === 'Acme' ? 'Electronics' : 'Clothing',
      description: `${tenantName} category`
    })
  });
  
  const category = await categoryResponse.json();
  console.log('Category created:', category);
  
  // Add test product
  const productResponse = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: tenantName === 'Acme' ? 'iPhone 15 Pro' : 'Cotton T-Shirt',
      description: `${tenantName} test product`,
      price: tenantName === 'Acme' ? '999.99' : '29.99',
      sku: `${tenantName.toUpperCase()}-001`,
      categoryId: category.id
    })
  });
  
  const product = await productResponse.json();
  console.log('Product created:', product);
}

// Usage:
// createTestData('Acme');    // Run in Acme tenant
// createTestData('Beta');    // Run in Beta tenant
```

## ✅ Test Checklist

- [ ] Both tenants created successfully
- [ ] Admin login works for both tenants
- [ ] Products are isolated by tenant
- [ ] Customers are isolated by tenant  
- [ ] Orders are isolated by tenant
- [ ] API endpoints respect tenant context
- [ ] Cross-tenant access is blocked
- [ ] Database queries include tenant filtering
- [ ] JWT tokens are tenant-specific
- [ ] Session management is secure

## 📊 Expected Database State

After testing, your database should show:

```
tenants:
- Acme Electronics (acme-electronics)
- Beta Retail Co (beta-retail)

adminUsers:
- John Smith (Acme tenant)
- Sarah Johnson (Beta tenant)

products: (if created)
- iPhone 15 Pro (Acme tenant)
- Cotton T-Shirt (Beta tenant)

categories: (if created)
- Electronics (Acme tenant)
- Clothing (Beta tenant)
```

## 🚀 Next Steps

1. **Complete Manual Testing**: Follow all test cases above
2. **Fix Any Issues**: Update API routes that aren't tenant-aware
3. **Add More Test Data**: Create comprehensive test scenarios
4. **Automate Testing**: Create automated test suites
5. **Deploy to Production**: Test with real subdomains

---

## 🎉 Success Criteria

Your multi-tenant system is working correctly when:

✅ **Complete Data Isolation**: No cross-tenant data visibility  
✅ **Secure Authentication**: Tenant-specific login and sessions  
✅ **API Protection**: All endpoints respect tenant context  
✅ **Database Integrity**: All queries are tenant-filtered  
✅ **URL Security**: Subdomain changes don't bypass security  

Happy Testing! 🧪
