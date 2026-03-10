# Multi-Tenant Troubleshooting Guide

## 🚨 "Tenant not found" Error - Root Cause Analysis

Based on your issue, here are the most common causes and solutions:

## 🔍 Issue #1: Missing Environment Configuration (MOST LIKELY)

**Symptoms:**
- "Tenant not found" error when accessing subdomains
- Database connection errors
- Middleware failing to find tenant data

**Solution:**
1. **Create environment file:**
   ```bash
   cp env.template .env.local
   ```

2. **Update `.env.local` with your actual database credentials:**
   ```env
   # Database Configuration
   DB_HOST=your-actual-database-host
   DB_USER=your-actual-database-user
   DB_PASS=your-actual-database-password
   DB_NAME=your-actual-database-name
   DB_PORT=3306

   # NextAuth Configuration
   NEXTAUTH_SECRET=your-super-secret-jwt-secret-key-here
   NEXTAUTH_URL=http://localhost:3000

   # Multi-tenant Configuration
   NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
   NEXT_PUBLIC_APP_NAME="Your Inventory System"

   # Development
   NODE_ENV=development
   ```

## 🔍 Issue #2: No Tenants in Database

**Check if tenants exist:**
```sql
-- Connect to your database and run:
SELECT id, name, slug, status FROM tenants;
```

**If no tenants found, create test tenants:**
```bash
# Run the tenant creation script:
node scripts/test-api.js
```

## 🔍 Issue #3: Incorrect Subdomain Testing

**For Local Development, you need to use one of these methods:**

### Method A: Use /etc/hosts (Mac/Linux)
```bash
# Edit hosts file
sudo nano /etc/hosts

# Add these lines:
127.0.0.1 acme-electronics.localhost
127.0.0.1 beta-retail.localhost
```

Then test: `http://acme-electronics.localhost:3000`

### Method B: Use ngrok (Recommended)
```bash
# Start your app
npm run dev

# In another terminal:
npx ngrok http 3000

# Use the ngrok URL with subdomains:
# https://acme-electronics.your-ngrok-url.ngrok.io
```

### Method C: Modify Middleware for Development
Edit `lib/tenant.ts` line 36-38 to enable localhost subdomains:

```typescript
// Handle localhost and development
if (host.includes('localhost') || host.includes('127.0.0.1') || host.includes('192.168.')) {
  // For development, check if subdomain is present
  if (host.includes('localhost') && parts.length >= 2) {
    return parts[0]; // Return subdomain part
  }
  return null;
}
```

## 🔍 Issue #4: Database Connection Problems

**Test database connection:**
```bash
# Create a simple test file
echo "
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });
    console.log('✅ Database connected successfully');
    await connection.end();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}
testConnection();
" > test-db.js

node test-db.js
rm test-db.js
```

## 🔍 Issue #5: Middleware Debug

**Enable middleware debugging:**

Add this to your `.env.local`:
```env
NODE_ENV=development
```

Then check your terminal logs when accessing subdomains. You should see:
```
Middleware Debug: {
  hostname: 'acme-electronics.localhost:3000',
  subdomain: 'acme-electronics',
  pathname: '/',
  isSubdomainRequest: true
}
```

## 🛠 Step-by-Step Debugging Process

### Step 1: Verify Environment Setup
```bash
# Check if .env.local exists
ls -la .env.local

# If not, create it:
cp env.template .env.local
# Then edit with your database credentials
```

### Step 2: Test Database Connection
```bash
# Install mysql2 if not installed
npm install mysql2

# Test connection (create test-db.js as shown above)
node test-db.js
```

### Step 3: Check/Create Tenants
```bash
# Run tenant creation script
node scripts/test-api.js
```

### Step 4: Test Subdomain Resolution
```bash
# Method 1: Add to /etc/hosts
sudo echo "127.0.0.1 test-tenant.localhost" >> /etc/hosts

# Method 2: Use ngrok
npx ngrok http 3000
```

### Step 5: Monitor Middleware Logs
```bash
# Start dev server and watch logs
npm run dev

# In another terminal, test subdomain
curl http://test-tenant.localhost:3000
```

## 🎯 Quick Fix Commands

**Complete setup from scratch:**
```bash
# 1. Create environment file
cp env.template .env.local

# 2. Edit .env.local with your database credentials (use your editor)
# nano .env.local

# 3. Install dependencies
npm install

# 4. Create test tenants
node scripts/test-api.js

# 5. Add test subdomain to hosts
echo "127.0.0.1 acme-electronics.localhost" | sudo tee -a /etc/hosts

# 6. Test
curl http://acme-electronics.localhost:3000
```

## 🚨 Common Error Messages & Solutions

### "Tenant not found"
- ✅ Check `.env.local` exists and has correct DB credentials
- ✅ Verify tenants exist in database
- ✅ Confirm subdomain format is correct

### "Cannot connect to database"
- ✅ Check DB credentials in `.env.local`
- ✅ Ensure database server is running
- ✅ Verify firewall/network access

### "Middleware not executing"
- ✅ Check middleware.ts matcher configuration
- ✅ Verify Next.js version compatibility
- ✅ Check for conflicting middleware

### "Subdomain not resolving"
- ✅ Use /etc/hosts for local testing
- ✅ Use ngrok for external testing
- ✅ Check DNS configuration for production

## 🎉 Success Checklist

Once fixed, you should see:

- ✅ `http://localhost:3000` → Landing page or main domain
- ✅ `http://acme-electronics.localhost:3000` → Tenant login page
- ✅ Login works with: `admin@acme-electronics.com` / `admin123`
- ✅ Tenant dashboard shows tenant-specific data
- ✅ Middleware logs show successful tenant resolution

## 📞 Still Having Issues?

If you're still getting "tenant not found" after following this guide:

1. **Share your `.env.local` file** (with credentials masked)
2. **Share middleware logs** from terminal
3. **Confirm which testing method** you're using (hosts file, ngrok, etc.)
4. **Share the exact URL** you're trying to access

The most common issue is missing environment configuration, so start there! 🎯
