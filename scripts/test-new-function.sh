#!/bin/bash

# Test New Function Registration

echo "🧪 Testing New Function Registration..."

echo "⏳ Waiting for deployment (30 seconds)..."
sleep 30

echo "📊 Checking endpoint status:"
curl -s "https://taxmahir.pk/api/inngest" | jq '{function_count, mode, has_event_key, has_signing_key}'

echo ""
echo "📊 Checking subdomain endpoint:"
curl -s "https://swd.taxmahir.pk/api/inngest" | jq '{function_count, mode, has_event_key, has_signing_key}'

echo ""
echo "✅ Analysis:"
echo "- Both endpoints should still show function_count: 1"
echo "- But now it's the NEW function: 'fbr-inventory-admin-fbr-user-bulk-import-v2'"
echo "- The old 'Debug User Import Function' should no longer be triggered"

echo ""
echo "🎯 Expected in Inngest Dashboard:"
echo "✅ New function: 'fbr-inventory-admin-fbr-user-bulk-import-v2'"
echo "❌ Old functions should become inactive/disconnected"

echo ""
echo "🧪 Test Instructions:"
echo "1. Go to https://swd.taxmahir.pk/users/bulk-upload"
echo "2. Upload a small CSV file (2-3 users)"
echo "3. Monitor Inngest dashboard during import"
echo "4. You should see ONLY ONE function execution:"
echo "   - Function name: 'fbr-inventory-admin-fbr-user-bulk-import-v2'"
echo "   - OR display name: 'FBR User Bulk Import V2'"
echo "5. NO 'Debug User Import Function' should run"

echo ""
echo "📋 If Successful:"
echo "✅ Only one function execution per bulk import"
echo "✅ Users are imported successfully"
echo "✅ No errors in Inngest dashboard"
echo "✅ Clean, single function workflow"

echo ""
echo "🔍 If Debug Function Still Runs:"
echo "❌ This would indicate the debug function is registered under a different app/client"
echo "❌ May require manual deletion from Inngest dashboard"
echo "❌ Or contact Inngest support for help"
