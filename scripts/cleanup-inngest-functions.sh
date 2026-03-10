#!/bin/bash

# Clean up old Inngest functions and sync current ones

echo "🧹 Cleaning up Inngest Functions..."

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "📋 Current functions in codebase:"
echo "- user-bulk-import (in lib/inngest/functions/bulk-user-import.ts)"
echo ""

# Get domain from user
read -p "Enter your domain (e.g., taxmahir.pk): " domain
if [ -z "$domain" ]; then
    echo "❌ Domain is required"
    exit 1
fi

echo "🔄 Syncing functions with Inngest Cloud..."
echo "This will:"
echo "- Register current functions from your codebase"
echo "- Remove old/unused functions like 'Debug User Import Function'"
echo ""

# Sync functions - this should remove old functions and register current ones
npx inngest-cli sync --url "https://$domain/api/inngest"

echo ""
echo "✅ Function sync completed!"
echo ""
echo "📊 Expected Results:"
echo "✅ Only 'user-bulk-import' function should be active"
echo "❌ 'Debug User Import Function' should be removed/inactive"
echo ""
echo "🔍 Verify in Inngest Dashboard:"
echo "1. Go to app.inngest.com"
echo "2. Navigate to Functions"
echo "3. Check that only 'fbr-inventory-admin-user-bulk-import' is listed"
echo "4. Old debug functions should be gone or marked as inactive"
echo ""
echo "🧪 Test bulk import:"
echo "1. Go to https://swd.$domain/users/bulk-upload"
echo "2. Upload a CSV file"
echo "3. Verify only one function runs (not two)"
echo "4. Check Inngest dashboard shows only one execution"
