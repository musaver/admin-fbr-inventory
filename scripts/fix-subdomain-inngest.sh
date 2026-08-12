#!/bin/bash

# Fix Inngest Authentication for Subdomain Tenants

echo "🔧 Fixing Inngest Authentication for Subdomain Tenants..."

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "📝 Staging middleware changes..."
git add middleware.ts

echo "💾 Committing subdomain fix..."
git commit -m "Fix: Exclude /api/inngest from tenant subdomain authentication

- Add /api/inngest skip logic to handleTenantAuthentication function
- Prevents 500 errors when Inngest webhooks are called from tenant subdomains
- Ensures bulk import works correctly for all tenants

Fixes: 500 Internal Server Error on https://demo.hisaab360invoicing.com/users/bulk-upload"

echo "🚀 Deploying to Vercel..."
git push

echo "⏳ Waiting for deployment (30 seconds)..."
sleep 30

echo "🧪 Testing subdomain endpoint..."
read -p "Enter your tenant subdomain (e.g., demo.hisaab360invoicing.com): " subdomain
if [ -z "$subdomain" ]; then
    echo "❌ Subdomain is required"
    exit 1
fi

# Test the main domain endpoint
echo "📡 Testing main domain: https://hisaab360invoicing.com/api/inngest"
main_response=$(curl -s -w "HTTP_STATUS:%{http_code}" "https://hisaab360invoicing.com/api/inngest")
main_status=$(echo "$main_response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d':' -f2)
echo "Main domain status: $main_status"

# Test the subdomain endpoint  
echo "📡 Testing subdomain: https://$subdomain/api/inngest"
sub_response=$(curl -s -w "HTTP_STATUS:%{http_code}" "https://$subdomain/api/inngest")
sub_status=$(echo "$sub_response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d':' -f2)
echo "Subdomain status: $sub_status"

if [ "$main_status" = "200" ] && [ "$sub_status" = "200" ]; then
    echo "✅ Both endpoints are working correctly!"
    echo ""
    echo "🧪 Ready to test bulk import from subdomain!"
    echo "1. Go to https://$subdomain/users/bulk-upload"
    echo "2. Upload a small CSV file"
    echo "3. Verify import completes without 500 errors"
    echo ""
    echo "✅ Subdomain fix deployed successfully!"
else
    echo "❌ One or both endpoints failed:"
    echo "Main domain: $main_status"
    echo "Subdomain: $sub_status"
    echo ""
    echo "Check Vercel logs: npx vercel logs --follow"
fi

echo ""
echo "🔍 If issues persist, check:"
echo "1. Vercel function logs for both main domain and subdomain requests"
echo "2. Ensure INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY are set"
echo "3. Verify subdomain DNS is pointing to Vercel correctly"
