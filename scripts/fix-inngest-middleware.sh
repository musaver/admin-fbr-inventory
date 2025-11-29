#!/bin/bash

# Fix Inngest Middleware Authentication Issue

echo "🔧 Fixing Inngest Middleware Authentication..."

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "📝 Staging middleware changes..."
git add middleware.ts

echo "💾 Committing fix..."
git commit -m "Fix: Exclude /api/inngest from authentication middleware

- Add /api/inngest to middleware skip list
- Prevents 500 errors on Inngest webhook requests
- Allows Inngest to call webhook without authentication

Fixes: Internal server error 500 on bulk import completion"

echo "🚀 Deploying to Vercel..."
git push

echo "⏳ Waiting for deployment (30 seconds)..."
sleep 30

echo "🧪 Testing endpoint..."
read -p "Enter your domain (e.g., yourdomain.com): " domain
if [ -z "$domain" ]; then
    echo "❌ Domain is required"
    exit 1
fi

# Test the endpoint
echo "📡 Testing: https://$domain/api/inngest"
response=$(curl -s -w "HTTP_STATUS:%{http_code}" "https://$domain/api/inngest")
http_status=$(echo "$response" | grep -o "HTTP_STATUS:[0-9]*" | cut -d':' -f2)
body=$(echo "$response" | sed 's/HTTP_STATUS:[0-9]*$//')

echo "HTTP Status: $http_status"
echo "Response: $body"

if [ "$http_status" = "200" ]; then
    echo "✅ Endpoint is working correctly!"
    
    # Test a small bulk import
    echo ""
    echo "🧪 Ready to test bulk import!"
    echo "1. Go to https://$domain/users/bulk-upload"
    echo "2. Upload a small CSV file"
    echo "3. Check that import completes without 500 errors"
    echo ""
    echo "✅ Fix deployed successfully!"
else
    echo "❌ Endpoint returned status: $http_status"
    echo "Check Vercel logs: npx vercel logs --follow"
fi
