# Manual Multi-Tenant Testing Guide

Since automated testing with subdomains is complex, let's do manual testing to verify the multi-tenant functionality.

## 🎯 Testing Approach

We'll manually test the system using the browser to ensure proper tenant isolation.

## 📋 Test Steps

### Step 1: Set up Local Subdomains

Add these lines to your `/etc/hosts` file:

```bash
# Open terminal and run:
sudo nano /etc/hosts

# Add these lines:
127.0.0.1 acme-electronics.localhost
127.0.0.1 beta-retail.localhost
```

### Step 2: Test Tenant Login

**Test Acme Electronics:**
1. Open browser: `http://acme-electronics.localhost:3000/login`
2. Login with:
   - Email: `admin@acme-electronics.com`
   - Password: `admin123`
3. Verify you're redirected to dashboard

**Test Beta Retail:**
1. Open browser: `http://beta-retail.localhost:3000/login`
2. Login with:
   - Email: `admin@beta-retail.com`
   - Password: `admin123`
3. Verify you're redirected to dashboard

### Step 3: Test Data Isolation - Categories

**In Acme Electronics tenant:**
1. Go to Categories page
2. Add category: "Electronics" with description "Electronic devices"
3. Add category: "Accessories" with description "Electronic accessories"

**In Beta Retail tenant:**
1. Go to Categories page  
2. Add category: "Clothing" with description "Apparel items"
3. Add category: "Home & Garden" with description "Home supplies"

**Verification:**
- Acme should only see: Electronics, Accessories
- Beta should only see: Clothing, Home & Garden
- ❌ If you see all 4 categories in both tenants = ISOLATION FAILED

### Step 4: Test Data Isolation - Products

**In Acme Electronics tenant:**
1. Go to Products page
2. Add product:
   - Name: "iPhone 15 Pro"
   - Category: "Electronics"
   - Price: $999.99
   - SKU: "ACME-IPH15P-001"

**In Beta Retail tenant:**
1. Go to Products page
2. Add product:
   - Name: "Cotton T-Shirt"
   - Category: "Clothing" 
   - Price: $29.99
   - SKU: "BETA-TSH-001"

**Verification:**
- Acme should only see: iPhone 15 Pro
- Beta should only see: Cotton T-Shirt
- ❌ If you see both products in both tenants = ISOLATION FAILED

### Step 5: Test Data Isolation - Customers

**In Acme Electronics tenant:**
1. Go to Users/Customers page
2. Add customer:
   - Name: "Alice Cooper"
   - Email: "alice@example.com"
   - Phone: "+1-555-1001"

**In Beta Retail tenant:**
1. Go to Users/Customers page
2. Add customer:
   - Name: "Bob Wilson"
   - Email: "bob@example.com"
   - Phone: "+1-555-2001"

**Verification:**
- Acme should only see: Alice Cooper
- Beta should only see: Bob Wilson
- ❌ If you see both customers in both tenants = ISOLATION FAILED

### Step 6: Test Cross-Tenant Security

**Security Test 1 - URL Manipulation:**
1. Login to Acme Electronics
2. Try to access Beta Retail's products by changing URL
3. Should be blocked or redirected

**Security Test 2 - Session Isolation:**
1. Login to Acme Electronics in one browser tab
2. Open Beta Retail in another tab
3. Should require separate login
4. Sessions should not cross-contaminate

## 🔍 Debugging Steps

If tests fail, check these:

### Check Database Isolation

Run these SQL queries to verify data:

```sql
-- Check tenants
SELECT id, name, slug, status FROM tenants;

-- Check categories by tenant
SELECT tenantId, name FROM categories ORDER BY tenantId;

-- Check products by tenant  
SELECT tenantId, name, sku FROM products ORDER BY tenantId;

-- Check users by tenant
SELECT tenantId, name, email FROM user ORDER BY tenantId;
```

### Check API Responses

Open browser dev tools and check API calls:

1. Go to Network tab
2. Navigate to Categories page
3. Look for `/api/categories` call
4. Check response - should only show tenant's data

### Check Middleware Logs

Look at terminal where `npm run dev` is running:
- Should see "Middleware Debug" logs
- Should show subdomain extraction
- Should show tenant resolution

## ✅ Success Criteria

✅ **Login Isolation**: Each tenant admin can only login to their subdomain  
✅ **Data Isolation**: Each tenant only sees their own categories, products, customers  
✅ **API Security**: API calls return only tenant-specific data  
✅ **Session Security**: Sessions don't cross between tenants  
✅ **URL Security**: Can't access other tenant's data via URL manipulation  

## 🚨 Common Issues

**Issue 1: "Tenant context not found"**
- Middleware not setting tenant headers
- Check subdomain extraction logic
- Verify tenant exists in database

**Issue 2: Seeing all tenants' data**
- API routes not using `withTenant` wrapper
- Database queries missing `WHERE tenantId = ?`
- Need to fix API route implementations

**Issue 3: Login redirects to wrong tenant**
- Authentication not tenant-aware
- Session not including tenant context
- Check NextAuth configuration

## 📊 Expected Results

After successful testing:

```
Database State:
- 2 tenants (acme-electronics, beta-retail)
- 2 admin users (1 per tenant)
- 4 categories (2 per tenant, isolated)
- 2 products (1 per tenant, isolated)  
- 2 customers (1 per tenant, isolated)

UI Behavior:
- Each tenant sees only their data
- Login works for each tenant separately
- No cross-tenant data leakage
- API calls are tenant-filtered
```

## 🛠 Next Steps

If manual testing reveals issues:

1. **Fix API Routes**: Update remaining routes to use `withTenant`
2. **Fix Database Queries**: Add tenant filtering to all queries
3. **Fix Authentication**: Ensure sessions are tenant-aware
4. **Add More Tests**: Create comprehensive test scenarios

Ready to test! 🧪
