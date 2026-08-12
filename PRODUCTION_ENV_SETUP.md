# Production Environment Setup for Product Import

## Required Environment Variables for Production

Add these environment variables to your Vercel project settings:

### Database Configuration
```bash
DB_HOST=your-production-database-host
DB_USER=your-database-user
DB_PASS=your-database-password
DB_NAME=your-database-name
DB_PORT=3306
```

### NextAuth Configuration
```bash
NEXTAUTH_SECRET=your-super-secret-jwt-secret-key
NEXTAUTH_URL=https://yourdomain.com
```

### Multi-tenant Configuration
```bash
NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com
NEXT_PUBLIC_APP_NAME="Your Inventory App"
```

### **NEW: Vercel Blob Configuration (Required for Product Import)**
```bash
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

### Email Configuration
```bash
EMAIL_FROM=noreply@yourdomain.com
SENDINBLUE_API_KEY=your-sendinblue-api-key
```

## Production Setup Steps

### 1. Vercel Blob Setup
1. Go to your Vercel dashboard
2. Navigate to your project → Storage
3. Create a new Blob store (if not already created)
4. Copy the `BLOB_READ_WRITE_TOKEN` from the connection string
5. Add it to your Vercel environment variables

### 3. Database Setup
Ensure your production database has the `import_jobs` table:

```sql
CREATE TABLE IF NOT EXISTS import_jobs (
  id VARCHAR(255) NOT NULL PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  blob_url VARCHAR(500) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  total_records INT DEFAULT 0,
  processed_records INT DEFAULT 0,
  successful_records INT DEFAULT 0,
  failed_records INT DEFAULT 0,
  errors JSON,
  results JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  created_by VARCHAR(255) NOT NULL,
  INDEX idx_tenant_id (tenant_id),
  INDEX idx_type (type),
  INDEX idx_status (status)
);
```

### 4. Vercel Deployment
After setting up environment variables:

```bash
# Deploy to Vercel
vercel --prod

# Or if using Vercel CLI
npm run build
vercel deploy --prod
```

## Testing Production Import

1. **Access your live domain**: `https://yourdomain.com/users/bulk-upload?tab=products`
2. **Upload a test CSV** with columns: `name,price,description,sku`
3. **Monitor progress** in real-time
4. **Check Vercel function logs** for function execution logs

## Production Benefits

✅ **Non-blocking uploads**: Processing runs after the response (Next.js `after()`)
✅ **No Timeouts**: Handle files up to 100MB
✅ **Concurrent Imports**: Multiple users can import simultaneously
✅ **Real-time Progress**: Users see live progress updates
✅ **Error Handling**: Detailed error reporting per row
✅ **Multi-tenant**: Complete tenant isolation

## Troubleshooting

### Import Jobs Stuck in "Pending"
- Check Vercel function logs for execution details

### Blob Upload Errors
- Verify `BLOB_READ_WRITE_TOKEN` is correct
- Check Vercel Blob storage limits
- Ensure file size is under 100MB

### Database Errors
- Verify database connection and credentials
- Check `import_jobs` table exists
- Ensure proper indexes are created

## Support

For issues specific to:
- **Vercel Blob**: [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- **Database**: Check your database provider's documentation
