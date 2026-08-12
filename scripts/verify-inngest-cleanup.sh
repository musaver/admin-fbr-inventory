#!/bin/bash

# Verify Inngest Function Cleanup

echo "🔍 Verifying Inngest Function Status..."

echo "📊 Current Application Status:"
echo "Main domain endpoint:"
curl -s "https://hisaab360invoicing.com/api/inngest" | jq '{function_count, mode, has_event_key, has_signing_key}'

echo ""
echo "Subdomain endpoint:"
curl -s "https://demo.hisaab360invoicing.com/api/inngest" | jq '{function_count, mode, has_event_key, has_signing_key}'

echo ""
echo "✅ Analysis:"
echo "- Both endpoints show function_count: 1"
echo "- This means only your current 'user-bulk-import' function is active"
echo "- The 'Debug User Import Function' is likely stale/inactive"

echo ""
echo "🎯 To Remove Debug Function from Inngest Dashboard:"
echo "1. Go to app.inngest.com"
echo "2. Navigate to Functions"
echo "3. Find 'Debug User Import Function'"
echo "4. Click on it → Settings → Archive/Delete"
echo "5. Or it may already show as 'Inactive' since it's not in your current deployment"

echo ""
echo "🧪 Test Current Setup:"
echo "1. Go to https://demo.hisaab360invoicing.com/users/bulk-upload"
echo "2. Upload a small CSV file"
echo "3. Monitor Inngest dashboard - you should see only ONE function execution"
echo "4. Check function name: should be 'fbr-inventory-admin-user-bulk-import'"

echo ""
echo "📋 Expected Behavior:"
echo "✅ Only one function runs per bulk import"
echo "✅ Function name: fbr-inventory-admin-user-bulk-import"
echo "❌ No 'Debug User Import Function' executions"

echo ""
echo "🔧 If Debug Function Still Runs:"
echo "This would indicate the function is somehow still connected to your app."
echo "In that case, we'd need to check for:"
echo "- Old function definitions in your codebase"
echo "- Multiple Inngest app configurations"
echo "- Cached function registrations"
