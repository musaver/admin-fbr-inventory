#!/bin/bash

# Test Inngest Endpoint and Function Registration

echo "🧪 Testing Inngest Endpoint..."

# Get domain from user
read -p "Enter your domain (e.g., yourdomain.com): " domain
if [ -z "$domain" ]; then
    echo "❌ Domain is required"
    exit 1
fi

echo ""
echo "🔍 Testing endpoint: https://$domain/api/inngest"
echo ""

# Test GET request
echo "📡 Testing GET request..."
response=$(curl -s "https://$domain/api/inngest")
echo "Response: $response"

# Check if response contains expected fields
if echo "$response" | grep -q "function_count"; then
    echo "✅ Endpoint is responding correctly"
    
    # Extract function count
    function_count=$(echo "$response" | grep -o '"function_count":[0-9]*' | cut -d':' -f2)
    echo "📊 Function count: $function_count"
    
    if [ "$function_count" = "1" ]; then
        echo "✅ Function is registered"
    else
        echo "⚠️  Expected 1 function, found $function_count"
    fi
else
    echo "❌ Endpoint not responding correctly"
    echo "Response: $response"
fi

echo ""
echo "🔄 Syncing functions with Inngest..."
npx inngest-cli sync --url "https://$domain/api/inngest"

echo ""
echo "✅ Test completed!"
echo ""
echo "📋 Check Inngest Dashboard:"
echo "1. Go to app.inngest.com"
echo "2. Navigate to Functions"
echo "3. Look for 'fbr-inventory-admin-user-bulk-import'"
echo "4. Verify it shows as active/registered"
