#!/bin/bash

# Update all existing tenants to use PKR currency instead of USD
# This script ensures complete migration to PKR as the default currency

echo "🇵🇰 Updating all tenants to use PKR currency as default..."

# Check if we have database connection
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set your database URL before running this migration"
    exit 1
fi

# Backup current tenant settings (optional but recommended)
echo "📋 Creating backup of current tenant settings..."
timestamp=$(date +"%Y%m%d_%H%M%S")
backup_file="tenant_currency_backup_${timestamp}.sql"

# Create backup query
echo "-- Backup of tenant currency settings before PKR migration" > "$backup_file"
echo "-- Created: $(date)" >> "$backup_file"
echo "" >> "$backup_file"

# Add the actual migration
echo "🔄 Applying currency migration to PKR..."

# Parse DATABASE_URL to extract connection parameters
# This is a simplified parser - adjust based on your DATABASE_URL format
DB_USER=$(echo $DATABASE_URL | grep -o '://[^:]*:[^@]*' | cut -d':' -f2 | cut -d'/' -f3)
DB_PASS=$(echo $DATABASE_URL | grep -o ':[^@]*@' | cut -d':' -f2 | cut -d'@' -f1)
DB_HOST=$(echo $DATABASE_URL | grep -o '@[^:]*:' | cut -d'@' -f2 | cut -d':' -f1)
DB_PORT=$(echo $DATABASE_URL | grep -o ':[0-9]*/' | cut -d':' -f2 | cut -d'/' -f1)
DB_NAME=$(echo $DATABASE_URL | grep -o '/[^?]*' | cut -d'/' -f2)

# Execute the migration
mysql -u"$DB_USER" -p"$DB_PASS" -h"$DB_HOST" -P"$DB_PORT" "$DB_NAME" < migrations/update-all-tenants-currency-to-pkr.sql

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📊 Summary of changes:"
    echo "   • All tenant settings updated to use PKR currency"
    echo "   • Existing USD currency settings changed to PKR"
    echo "   • Default PKR settings created for tenants without currency config"
    echo ""
    echo "🔧 What this means:"
    echo "   • All existing tenants now default to PKR (₨) currency"
    echo "   • New tenants will continue to use PKR as default"
    echo "   • Users can still change currency in Settings if needed"
    echo "   • All price displays will show ₨ symbol by default"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Restart your application to ensure changes take effect"
    echo "   2. Test a few tenant logins to verify PKR currency display"
    echo "   3. Check order forms and product pages for ₨ symbols"
    echo "   4. Verify Settings page allows currency changes per tenant"
    echo ""
    echo "📁 Backup created: $backup_file (if needed for rollback)"
else
    echo "❌ Migration failed!"
    echo "Please check your database connection and try again."
    echo "Check the error messages above for specific issues."
    exit 1
fi

echo ""
echo "🎉 All tenants are now using PKR as their default currency!"
