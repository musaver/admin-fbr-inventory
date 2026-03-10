# Multi-Tenant Deployment Guide

This guide will help you deploy your multi-tenant inventory system to Vercel with subdomain support.

## Prerequisites

- Vercel account
- Domain name with Vercel nameservers configured
- MySQL database (PlanetScale, Railway, or similar)
- Basic understanding of DNS and domains

## Step 1: Vercel Domain Configuration

### 1.1 Add Domains to Vercel Project

1. Go to your Vercel project dashboard
2. Navigate to Settings → Domains
3. Add these domains:
   - `yourdomain.com` (your root domain)
   - `*.yourdomain.com` (wildcard for subdomains)

### 1.2 Verify DNS Configuration

Since you're using Vercel nameservers, the DNS records will be automatically configured. Verify:

```bash
# Check if wildcard subdomain works
nslookup test.yourdomain.com
# Should resolve to Vercel's IP addresses
```

## Step 2: Environment Variables

### 2.1 Copy Environment Template

```bash
cp env.template .env.local
```

### 2.2 Update Environment Variables

Update `.env.local` with your actual values:

```env
# Database - Use your production database
DB_HOST=your-production-db-host
DB_USER=your-db-user
DB_PASS=your-db-password
DB_NAME=your-db-name

# NextAuth - Generate a secure secret
NEXTAUTH_SECRET=your-super-secure-secret-key
NEXTAUTH_URL=https://yourdomain.com

# Your actual domain
NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com
NEXT_PUBLIC_APP_NAME="Your Inventory System"

# Email configuration
EMAIL_FROM=noreply@yourdomain.com
SENDINBLUE_API_KEY=your-sendinblue-api-key
```

### 2.3 Add Environment Variables to Vercel

1. Go to Vercel project → Settings → Environment Variables
2. Add all variables from your `.env.local`
3. Make sure to set them for Production, Preview, and Development

## Step 3: Database Migration

### 3.1 Run Database Migration

Execute the migration script on your production database:

```bash
# Connect to your database and run:
mysql -h your-db-host -u your-db-user -p your-db-name < migrations/add-multi-tenant-support.sql
```

### 3.2 Create Default Tenant (if migrating existing data)

If you have existing data, create a default tenant first:

```sql
-- Create a default tenant for existing data
INSERT INTO tenants (
  id, name, slug, email, plan, status, max_users, max_products, max_orders,
  created_at, updated_at
) VALUES (
  'default-tenant-id',
  'Default Company',
  'default',
  'admin@yourdomain.com',
  'enterprise',
  'active',
  1000,
  50000,
  500000,
  NOW(),
  NOW()
);

-- Update existing admin users to belong to default tenant
UPDATE admin_users SET tenant_id = 'default-tenant-id';

-- Update existing data to belong to default tenant
UPDATE user SET tenant_id = 'default-tenant-id';
UPDATE categories SET tenant_id = 'default-tenant-id';
UPDATE products SET tenant_id = 'default-tenant-id';
UPDATE orders SET tenant_id = 'default-tenant-id';
-- ... repeat for all tables with tenant_id
```

## Step 4: Deploy to Vercel

### 4.1 Deploy Application

```bash
# Deploy to Vercel
npx vercel --prod

# Or if using Vercel CLI
vercel --prod
```

### 4.2 Verify Deployment

1. Check main domain: `https://yourdomain.com`
2. Test tenant registration: `https://yourdomain.com/signup`
3. Create a test tenant and verify subdomain works

## Step 5: Test Multi-Tenant Functionality

### 5.1 Create Test Tenant

1. Visit `https://yourdomain.com/signup`
2. Fill out the form with test data:
   - Company: "Test Company"
   - Subdomain: "testcompany"
   - Admin details
3. Complete registration

### 5.2 Verify Tenant Isolation

1. Login to `https://testcompany.yourdomain.com`
2. Create some products, customers, orders
3. Create another tenant and verify data isolation

### 5.3 Test Authentication

1. Try logging in with wrong tenant credentials
2. Verify session isolation between tenants
3. Test logout and re-login

## Step 6: Configure SSL (Automatic with Vercel)

Vercel automatically provides SSL certificates for:
- Root domain (`yourdomain.com`)
- Wildcard subdomains (`*.yourdomain.com`)

No additional configuration needed!

## Step 7: Monitoring and Analytics

### 7.1 Add Error Monitoring

Consider adding error monitoring:

```bash
npm install @sentry/nextjs
# Configure Sentry for error tracking
```

### 7.2 Add Analytics

Update environment variables:

```env
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

## Step 8: Custom Domain Support (Optional)

To allow tenants to use custom domains:

### 8.1 Update Vercel Configuration

Add to `vercel.json`:

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/custom-domain?domain=$host&path=$1",
      "has": [
        {
          "type": "host",
          "value": "(?!.*yourdomain\\.com$).*"
        }
      ]
    }
  ]
}
```

### 8.2 Create Custom Domain Handler

Create `app/api/custom-domain/route.ts` to handle custom domain routing.

## Troubleshooting

### Common Issues

1. **Subdomain not resolving**
   - Check DNS propagation (can take 24-48 hours)
   - Verify wildcard domain is added to Vercel

2. **Authentication issues**
   - Check NEXTAUTH_SECRET is set
   - Verify NEXTAUTH_URL matches your domain

3. **Database connection errors**
   - Verify database credentials
   - Check if database allows connections from Vercel IPs

4. **Tenant isolation not working**
   - Verify all API routes use tenant filtering
   - Check middleware is properly configured

### Debug Commands

```bash
# Check DNS resolution
nslookup subdomain.yourdomain.com

# Test API endpoints
curl https://subdomain.yourdomain.com/api/products

# Check Vercel logs
npx vercel logs
```

## Security Considerations

1. **Database Security**
   - Use strong passwords
   - Enable SSL connections
   - Restrict database access to necessary IPs

2. **Application Security**
   - Keep dependencies updated
   - Use strong JWT secrets
   - Enable CORS properly

3. **Tenant Isolation**
   - Always filter by tenant_id in queries
   - Validate tenant access in middleware
   - Use proper session management

## Performance Optimization

1. **Database Indexing**
   - Add indexes on tenant_id columns
   - Monitor query performance

2. **Caching**
   - Implement Redis caching for tenant data
   - Use Vercel Edge caching

3. **Monitoring**
   - Set up database monitoring
   - Monitor response times per tenant

## Backup and Recovery

1. **Database Backups**
   - Set up automated daily backups
   - Test backup restoration process

2. **Application Backups**
   - Use git for code versioning
   - Document deployment process

## Support and Maintenance

1. **Tenant Management**
   - Create admin dashboard for tenant management
   - Implement billing and subscription management

2. **Updates**
   - Plan for zero-downtime deployments
   - Test updates on staging environment first

---

## Next Steps

After successful deployment:

1. Set up monitoring and alerts
2. Create tenant management dashboard
3. Implement billing system
4. Add more advanced features
5. Scale database as needed

Your multi-tenant inventory system is now ready for production use!
