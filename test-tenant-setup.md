# Testing Multi-Tenant Setup

## ✅ Database Schema Fixed

The duplicate `adminUsersRelations` export error has been resolved. The database schema now successfully includes:

- ✅ `tenants` table created
- ✅ `tenant_id` added to all business tables
- ✅ Relations properly configured
- ✅ Database push completed successfully

## Next Steps to Test

### 1. Test Tenant Registration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Visit the signup page:
   ```
   http://localhost:3000/signup
   ```

3. Fill out the form with test data:
   - Company Name: "Test Company"
   - Subdomain: "testcompany"
   - Admin Email: "admin@testcompany.com"
   - Password: "password123"

### 2. Test Subdomain Access (Development)

Since subdomains don't work on localhost, you have a few options:

#### Option A: Use ngrok (Recommended)
```bash
# Install ngrok if you haven't
npm install -g ngrok

# In one terminal, start your app
npm run dev

# In another terminal, expose with ngrok
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok.io
# Test subdomain: https://testcompany.abc123.ngrok.io
```

#### Option B: Modify /etc/hosts (Mac/Linux)
```bash
# Add these lines to /etc/hosts
127.0.0.1 testcompany.localhost
127.0.0.1 anothertenant.localhost

# Then access: http://testcompany.localhost:3000
```

#### Option C: Use Development Domain Detection
The middleware already handles localhost differently, so you can test the core functionality without subdomains first.

### 3. Test API Endpoints

After creating a tenant, test that the API routes work with tenant filtering:

```bash
# Test products API (should be empty for new tenant)
curl http://testcompany.localhost:3000/api/products

# Or with ngrok:
curl https://testcompany.abc123.ngrok.io/api/products
```

### 4. Test Authentication

1. Try logging in at the tenant subdomain
2. Verify session includes tenant information
3. Test that you can't access another tenant's data

## Environment Variables Needed

Make sure your `.env.local` includes:

```env
# Your database credentials
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASS=your-db-password
DB_NAME=your-db-name

# NextAuth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000

# Multi-tenant (for development)
NEXT_PUBLIC_ROOT_DOMAIN=localhost:3000
```

## Common Issues and Solutions

### 1. "Tenant not found" Error
- Check that the tenant was created in the database
- Verify the subdomain matches exactly

### 2. Authentication Issues
- Clear browser cookies
- Check that NEXTAUTH_SECRET is set
- Verify database connection

### 3. API Route Errors
- Check that tenant_id is being passed correctly
- Verify all tables have tenant_id column

## Production Deployment

When ready for production:

1. Add your domain to Vercel:
   ```bash
   npx vercel domains add yourdomain.com
   npx vercel domains add "*.yourdomain.com"
   ```

2. Update environment variables:
   ```env
   NEXTAUTH_URL=https://yourdomain.com
   NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com
   ```

3. Deploy:
   ```bash
   npx vercel --prod
   ```

The multi-tenant system is now ready for testing! 🎉
