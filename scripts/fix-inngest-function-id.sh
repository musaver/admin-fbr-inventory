#!/bin/bash

# Fix Inngest Function ID Mismatch

echo "🔧 Fixing Inngest Function ID Mismatch..."

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "📝 Staging changes..."
git add lib/inngest.ts
git add lib/inngest/functions/bulk-user-import.ts

echo "💾 Committing changes..."
git commit -m "Fix Inngest function ID mismatch

- Update Inngest client ID to match expected prefix
- Add explicit function name for better identification
- Ensure function ID matches what Inngest Cloud expects

Fixes: Could not find function with ID error"

echo "🚀 Deploying to Vercel..."
git push

echo "⏳ Waiting for deployment (30 seconds)..."
sleep 30

echo "🔄 Syncing functions with Inngest Cloud..."
# Get the domain from user input or use default
read -p "Enter your domain (e.g., yourdomain.com): " domain
if [ -z "$domain" ]; then
    echo "❌ Domain is required"
    exit 1
fi

# Sync functions
npx inngest-cli sync --url "https://$domain/api/inngest"

echo "✅ Function sync completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Check Inngest Dashboard → Functions"
echo "2. Verify 'user-bulk-import' function is listed"
echo "3. Test bulk import with small CSV file"
echo "4. Monitor function execution in Inngest Dashboard"
echo ""
echo "🔍 If issues persist:"
echo "1. Check Vercel function logs: npx vercel logs --follow"
echo "2. Verify environment variables in Vercel dashboard"
echo "3. Test endpoint directly: curl https://$domain/api/inngest"
