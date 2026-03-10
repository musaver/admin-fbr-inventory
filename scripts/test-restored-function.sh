#!/bin/bash

# Test Restored Function Functionality

echo "🔄 Testing Restored Function Functionality..."

echo "⏳ Waiting for deployment (30 seconds)..."
sleep 30

echo "📊 Checking endpoint status:"
curl -s "https://taxmahir.pk/api/inngest" | jq '{function_count, mode, has_event_key, has_signing_key}'

echo ""
echo "📊 Checking subdomain endpoint:"
curl -s "https://swd.taxmahir.pk/api/inngest" | jq '{function_count, mode, has_event_key, has_signing_key}'

echo ""
echo "✅ Function Status:"
echo "- Function ID: 'user-bulk-import' (restored to working version)"
echo "- Function Name: 'User Bulk Import (Production)'"
echo "- Full Inngest Name: 'fbr-inventory-admin-user-bulk-import'"

echo ""
echo "🧪 Test Instructions:"
echo "1. Go to https://swd.taxmahir.pk/users/bulk-upload"
echo "2. Upload a small CSV file (2-3 users)"
echo "3. Verify the import works correctly"
echo "4. Check Inngest dashboard for function execution"

echo ""
echo "📋 Expected Results:"
echo "✅ Function should work correctly (not stuck)"
echo "✅ Users should be imported successfully"
echo "✅ Progress tracking should work"
echo "✅ Import should complete without errors"

echo ""
echo "🎯 Regarding Debug Function:"
echo "- The debug function may still appear in Inngest dashboard"
echo "- But it should not be triggered by new imports"
echo "- Focus on: Does the main import work correctly?"

echo ""
echo "🔍 If Still Having Issues:"
echo "1. Check Vercel function logs: npx vercel logs --follow"
echo "2. Check Inngest dashboard for error details"
echo "3. Test with a very small CSV (1-2 users) first"
