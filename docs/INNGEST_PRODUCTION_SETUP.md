# Inngest Production Setup Guide

## 🚨 Issue: Inngest Runs Stuck at "Running" Status

When importing from your live Vercel domain, Inngest runs get stuck in "Running" status. This is caused by:

1. **Function timeout issues** (30s timeout too short)
2. **Missing Inngest webhook configuration**
3. **Missing environment variables**
4. **Inngest dev server not running in production**

## ✅ Fixes Required

### 1. Fix Vercel Function Timeout

**Problem**: Default 30s timeout is too short for bulk processing
**Solution**: Updated `vercel.json` to allow 5 minutes for Inngest endpoint

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    },
    "app/api/inngest/route.ts": {
      "maxDuration": 300
    }
  }
}
```

### 2. Configure Inngest for Production

#### Step 2.1: Set Up Inngest Cloud (Recommended)

1. **Create Inngest Account**:
   - Go to [inngest.com](https://inngest.com)
   - Sign up/login with your GitHub account
   - Create a new app

2. **Get API Keys**:
   - In Inngest dashboard, go to Settings → API Keys
   - Copy your `Event Key` and `Signing Key`

#### Step 2.2: Add Environment Variables to Vercel

Go to Vercel Dashboard → Your Project → Settings → Environment Variables:

```env
# Inngest Configuration (REQUIRED for production)
INNGEST_EVENT_KEY=your-inngest-event-key-here
INNGEST_SIGNING_KEY=your-inngest-signing-key-here

# Optional: Inngest Environment
INNGEST_ENV=production
```

#### Step 2.3: Configure Webhook in Inngest Dashboard

1. In Inngest dashboard, go to your app
2. Go to Settings → Webhooks
3. Add webhook URL: `https://yourdomain.com/api/inngest`
4. Enable the webhook

### 3. Alternative: Self-Hosted Inngest (Advanced)

If you prefer self-hosting, you can run Inngest on your own infrastructure:

```bash
# Deploy Inngest to your server
docker run -p 8288:8288 inngest/inngest:latest serve
```

Then update your Inngest client:

```typescript
// lib/inngest.ts
export const inngest = new Inngest({
  id: 'inventory-app',
  name: 'Inventory Management System',
  env: process.env.NODE_ENV,
  eventAPI: {
    baseURL: process.env.INNGEST_BASE_URL || 'https://api.inngest.com',
  },
});
```

### 4. Update Production Environment Variables

Add these to your Vercel environment variables:

```env
# Required for Inngest Production
INNGEST_EVENT_KEY=evt_your_event_key_here
INNGEST_SIGNING_KEY=signkey_your_signing_key_here
INNGEST_ENV=production

# Optional: Custom Inngest URL (if self-hosting)
INNGEST_BASE_URL=https://your-inngest-server.com

# Existing variables (make sure these are set)
DB_HOST=your-production-db-host
DB_USER=your-production-db-user
DB_PASS=your-production-db-password
DB_NAME=your-production-db-name
NEXTAUTH_SECRET=your-secure-secret
NEXTAUTH_URL=https://yourdomain.com
NEXT_PUBLIC_ROOT_DOMAIN=yourdomain.com
BLOB_READ_WRITE_TOKEN=your-vercel-blob-token
```

## 🔧 Testing the Fix

### Step 1: Deploy Changes

```bash
# Deploy the updated vercel.json
git add vercel.json
git commit -m "Fix Inngest function timeout"
git push
```

### Step 2: Test Bulk Import

1. Go to your live domain: `https://yoursubdomain.yourdomain.com/users/bulk-upload`
2. Upload a small test CSV (2-3 users)
3. Monitor the Inngest dashboard
4. Check that the status changes from "Running" → "Completed"

### Step 3: Monitor Logs

- **Vercel Logs**: `npx vercel logs --follow`
- **Inngest Dashboard**: Check function execution logs
- **Browser Network**: Check for any 504 timeout errors

## 🚨 Troubleshooting

### Issue: Internal Server Error 500 After Import

**Symptoms:**
- Inngest functions complete successfully
- Users are added to database
- Website shows 500 error after import completion
- Middleware logs show authentication attempts on `/api/inngest`

**Cause:** Middleware is trying to authenticate Inngest webhook requests

**Solution:** Exclude `/api/inngest` from authentication middleware

```typescript
// middleware.ts - Add this line to the main skip conditions
if (
  pathname.startsWith('/api/auth') ||
  pathname.startsWith('/api/inngest') || // Add this line
  // ... other exclusions
) {
  return NextResponse.next();
}
```

**For Multi-Tenant with Subdomains:** Also add to `handleTenantAuthentication` function:

```typescript
// middleware.ts - In handleTenantAuthentication function
async function handleTenantAuthentication(request: NextRequest, response: NextResponse, tenant: any) {
  const pathname = request.nextUrl.pathname;

  // Skip authentication for API routes that don't require tenant context
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/inngest') || // Add this line for subdomains
    pathname.startsWith('/api/upload') ||
    // ... other exclusions
  ) {
    return response;
  }
  // ... rest of function
}
```

**Deploy the fix:**
```bash
git add middleware.ts
git commit -m "Fix: Exclude /api/inngest from authentication middleware"
git push
```

### Issue: Still Stuck at "Running"

**Cause**: Webhook not configured properly
**Solution**: 
1. Check Inngest webhook URL is correct
2. Verify signing key matches
3. Check Vercel function logs for errors

### Issue: Function Timeout After 5 Minutes

**Cause**: Very large CSV file or database performance
**Solution**:
1. Reduce chunk size in bulk import function
2. Optimize database queries
3. Consider async processing with job queues

### Issue: "Invalid Signature" Errors

**Cause**: Wrong signing key
**Solution**:
1. Double-check `INNGEST_SIGNING_KEY` in Vercel
2. Regenerate keys in Inngest dashboard if needed

### Issue: Events Not Being Received

**Cause**: Event key misconfigured
**Solution**:
1. Verify `INNGEST_EVENT_KEY` is correct
2. Check Inngest dashboard for incoming events
3. Test with a simple event first

## 📊 Monitoring Production

### Inngest Dashboard

Monitor these metrics:
- **Function Success Rate**: Should be >95%
- **Average Duration**: Should be <2 minutes for small files
- **Error Rate**: Should be <5%

### Vercel Logs

Watch for:
- Function timeout warnings
- Database connection errors
- Memory usage spikes

### Database Performance

Monitor:
- Connection pool usage
- Query execution time
- Lock waits during bulk inserts

## 🎯 Performance Optimization

### For Large Files (>10k users)

1. **Increase Chunk Size**:
```typescript
// In bulk-user-import.ts
const CHUNK_SIZE = 100; // Increase from 50
```

2. **Optimize Database Inserts**:
```typescript
// Use batch inserts where possible
await db.insert(user).values(userBatch);
```

3. **Add Progress Callbacks**:
```typescript
// Update progress more frequently
if (processedCount % 25 === 0) {
  await updateProgress(jobId, processedCount);
}
```

## 🔐 Security Considerations

1. **Webhook Security**: Inngest verifies signatures automatically
2. **API Rate Limits**: Inngest handles rate limiting
3. **Data Privacy**: Files are processed in memory and not stored permanently
4. **Tenant Isolation**: Each import job is isolated by tenant ID

## 🚀 Next Steps

1. **Deploy the fixes** to Vercel
2. **Set up Inngest Cloud** account
3. **Add environment variables** to Vercel
4. **Configure webhook** in Inngest dashboard
5. **Test with small CSV** file
6. **Monitor for 24 hours** to ensure stability

After following this guide, your bulk import should work perfectly in production! 🎉
