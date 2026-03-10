#!/bin/bash

# Force Clean Inngest Function Registration

echo "🧹 Force cleaning Inngest function registration..."
echo "This will temporarily change the event name to break the old function connection."

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo ""
echo "🔄 Step 1: Temporarily change event name to break old function connection"

# Change the event name in the API route
sed -i.bak 's/user\/bulk-import/user\/bulk-import-v2/g' app/api/users/bulk-upload/route.ts

# Change the event name in the function
sed -i.bak 's/user\/bulk-import/user\/bulk-import-v2/g' lib/inngest/functions/bulk-user-import.ts

echo "✅ Changed event name from 'user/bulk-import' to 'user/bulk-import-v2'"

echo "📝 Committing temporary change..."
git add app/api/users/bulk-upload/route.ts lib/inngest/functions/bulk-user-import.ts
git commit -m "temp: Change event name to break old function connection"

echo "🚀 Deploying temporary change..."
git push

echo "⏳ Waiting for deployment (30 seconds)..."
sleep 30

echo ""
echo "🔄 Step 2: Change back to original event name"

# Restore the original event name
sed -i.bak2 's/user\/bulk-import-v2/user\/bulk-import/g' app/api/users/bulk-upload/route.ts
sed -i.bak2 's/user\/bulk-import-v2/user\/bulk-import/g' lib/inngest/functions/bulk-user-import.ts

echo "✅ Restored event name back to 'user/bulk-import'"

echo "📝 Committing final change..."
git add app/api/users/bulk-upload/route.ts lib/inngest/functions/bulk-user-import.ts
git commit -m "fix: Restore original event name after cleaning old functions

This deployment cycle should have cleared any stale 'Debug User Import Function'
that was listening to the same event name."

echo "🚀 Deploying final version..."
git push

echo "⏳ Waiting for final deployment (30 seconds)..."
sleep 30

# Clean up backup files
rm -f app/api/users/bulk-upload/route.ts.bak*
rm -f lib/inngest/functions/bulk-user-import.ts.bak*

echo ""
echo "✅ Force clean completed!"
echo ""
echo "📊 Expected Results:"
echo "✅ Old 'Debug User Import Function' should be disconnected/inactive"
echo "✅ Only 'fbr-inventory-admin-user-bulk-import' should run"
echo ""
echo "🧪 Test now:"
echo "1. Go to https://swd.taxmahir.pk/users/bulk-upload"
echo "2. Upload a CSV file"
echo "3. Monitor Inngest dashboard - should see only ONE function execution"
echo ""
echo "🔍 If debug function still runs:"
echo "The issue might be in Inngest Cloud configuration itself."
echo "You may need to contact Inngest support or manually delete the function from dashboard."
