# Inngest Cloud Setup for Production

## 🎯 Current Situation

You already have Inngest Cloud set up with a webhook URL. The webhook you see (`@https://inn.gs/e/...`) is **Inngest's internal endpoint** - this is correct and should stay as-is.

## ✅ What You Need to Do

### Step 1: Register Your Vercel App with Inngest

Inngest needs to know where your application is deployed. You need to register your Vercel app endpoint with Inngest.

#### Option A: Using Inngest Dashboard (Recommended)

1. **Go to your Inngest Dashboard**
2. **Navigate to Apps/Environments**
3. **Find your app** (probably named "inventory-app")
4. **Add/Update the Serve URL** to: `https://yourdomain.com/api/inngest`
5. **Save the configuration**

#### Option B: Using Inngest CLI

```bash
# Install Inngest CLI globally
npm install -g inngest-cli

# Sync your functions with Inngest Cloud
npx inngest-cli sync --url https://yourdomain.com/api/inngest
```

### Step 2: Verify Environment Variables in Vercel

Make sure these are set in Vercel Dashboard → Settings → Environment Variables:

```env
# These should already be configured if you're seeing the webhook
INNGEST_EVENT_KEY=evt_your_key_here
INNGEST_SIGNING_KEY=signkey_your_key_here
INNGEST_ENV=production
```

### Step 3: Test the Connection

#### Test 1: Check if Inngest can reach your app

Visit this URL in your browser:
```
https://yourdomain.com/api/inngest
```

You should see a JSON response like:
```json
{
  "authentication_succeeded": null,
  "has_event_key": true,
  "has_signing_key": true,
  "function_count": 1,
  "mode": "cloud"
}
```

#### Test 2: Manual Function Sync

If the above works, manually sync your functions:

```bash
# From your project directory
npx inngest-cli sync --url https://yourdomain.com/api/inngest
```

### Step 4: Debug Connection Issues

If Inngest still can't reach your app, check:

#### A. Vercel Function Logs
```bash
npx vercel logs --follow
```
Look for:
- Inngest webhook requests
- Any 404 or 500 errors on `/api/inngest`
- Function timeout issues

#### B. Test Your Inngest Endpoint Directly

```bash
# Test GET request
curl https://yourdomain.com/api/inngest

# Test POST request (simulating Inngest)
curl -X POST https://yourdomain.com/api/inngest \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```

### Step 5: Force Function Registration

If functions still don't appear in Inngest dashboard:

#### Update your Inngest route to force registration:

```typescript
// app/api/inngest/route.ts
import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest';
import { bulkUserImport } from '@/lib/inngest/functions/bulk-user-import';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [bulkUserImport],
  // Add this for debugging
  servePath: '/api/inngest',
  // Force registration on every request (temporary)
  landingPage: process.env.NODE_ENV === 'development',
});
```

## 🔍 Troubleshooting Specific Issues

### Issue: Functions Not Appearing in Dashboard

**Cause**: Inngest hasn't discovered your functions yet
**Solution**:
1. Make sure your Vercel app is deployed with the latest code
2. Visit `https://yourdomain.com/api/inngest` to trigger registration
3. Run `npx inngest-cli sync --url https://yourdomain.com/api/inngest`

### Issue: "Running" Status Stuck

**Cause**: Function timeout or connection issues
**Solution**:
1. ✅ Already fixed with 300s timeout in vercel.json
2. Check Vercel function logs for errors
3. Ensure Inngest can reach your webhook endpoint

### Issue: Authentication Errors

**Cause**: Wrong signing key
**Solution**:
1. Go to Inngest Dashboard → Settings → API Keys
2. Copy the correct `INNGEST_SIGNING_KEY`
3. Update in Vercel environment variables

## 🚀 Quick Test

After configuration, test with a small CSV:

1. Go to `https://yoursubdomain.yourdomain.com/users/bulk-upload`
2. Upload a 2-3 user CSV file
3. Check Inngest Dashboard → Runs
4. Should see: `Queued` → `Running` → `Completed`

## 📊 Expected Behavior

**Before Fix:**
- Functions stuck at "Running"
- No progress updates
- Timeout after 30 seconds

**After Fix:**
- Functions complete successfully
- Real-time progress updates
- Processing completes in 1-3 minutes

## 🎯 Next Steps

1. **Check your Inngest Dashboard** for the app serve URL
2. **Update serve URL** to your Vercel domain
3. **Test the endpoint** directly
4. **Try a small bulk import** to verify

The webhook URL you see is correct - you just need to make sure Inngest knows where to find your application!
