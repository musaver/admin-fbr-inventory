# FBR Tenant-Specific Settings Integration

## Overview

This integration moves FBR (Federal Board of Revenue) configuration from environment variables to tenant-specific database settings, allowing each tenant on their subdomain to have their own unique FBR configuration.

## Changes Made

### 1. Database Schema Updates

**File**: `migrations/add-tenant-id-to-settings.sql`
- Added `tenant_id` column to `settings` table
- Added foreign key constraint to `tenants` table
- Updated unique constraint to `(tenant_id, key)` to allow same setting keys for different tenants
- Added index for better query performance

**File**: `lib/schema.ts`
- Updated settings table schema to include `tenantId` field
- Added composite unique constraint and index definitions

### 2. Settings Page Updates

**File**: `app/settings/page.tsx`
- Added new FBR settings section with 6 fields:
  - FBR Base URL
  - FBR Sandbox Token
  - Seller NTN/CNIC
  - Seller Business Name
  - Seller Province
  - Seller Address
- Added state management for FBR settings
- Added validation and save functionality
- Added configuration status indicator

### 3. API Endpoints

**File**: `app/api/settings/fbr/route.ts` (New)
- GET: Retrieves tenant-specific FBR settings
- POST: Updates tenant-specific FBR settings
- Includes validation for required fields
- Tenant-aware using `getTenantContext()`

**File**: `app/api/seller-info/route.ts` (Updated)
- Now fetches from tenant-specific settings instead of environment variables
- Falls back to environment variables if no tenant settings exist
- Maintains backward compatibility

**File**: `app/api/settings/tax-settings/route.ts` (Updated)
- Made tenant-aware by adding tenant context checks
- All CRUD operations now include `tenant_id` in queries

## FBR Settings Fields

| Field | Key | Description |
|-------|-----|-------------|
| FBR Base URL | `fbr_base_url` | The base URL for FBR API endpoints |
| FBR Sandbox Token | `fbr_sandbox_token` | Authentication token for FBR API |
| Seller NTN/CNIC | `fbr_seller_ntncnic` | National Tax Number or CNIC |
| Seller Business Name | `fbr_seller_business_name` | Registered business name |
| Seller Province | `fbr_seller_province` | Business registration province |
| Seller Address | `fbr_seller_address` | Complete business address |

## How It Works

### For Settings Page
1. User navigates to `/settings`
2. Page fetches tenant-specific FBR settings via `/api/settings/fbr`
3. User can modify any of the 6 FBR fields
4. On save, settings are stored with the current tenant's ID
5. Each tenant has isolated FBR configuration

### For Order Creation
1. Order form loads and calls `/api/seller-info`
2. API fetches tenant-specific FBR settings from database
3. If no tenant settings exist, falls back to environment variables
4. Order form auto-fills with tenant-specific seller information
5. Order submission uses tenant's configured FBR settings

## Migration Instructions

### 1. Apply Database Migration
```bash
# Option 1: Run the migration script
./scripts/apply-settings-migration.sh

# Option 2: Apply manually using your database client
mysql -u username -p database_name < migrations/add-tenant-id-to-settings.sql
```

### 2. Restart Application
After applying the migration, restart your Next.js application to ensure the schema changes are recognized.

### 3. Configure FBR Settings
1. Login to your tenant subdomain (e.g., `tenant1.yourdomain.com`)
2. Navigate to Settings page
3. Scroll to "FBR Digital Invoicing" section
4. Fill in all required fields:
   - FBR Base URL (e.g., `https://esp.fbr.gov.pk`)
   - FBR Sandbox Token
   - Your NTN/CNIC number
   - Business name
   - Province
   - Business address
5. Click "Save FBR Settings"

### 4. Test Order Creation
1. Go to `/orders/add`
2. Verify that seller information fields are auto-filled with your tenant-specific settings
3. Create a test order to ensure FBR integration works

## Benefits

1. **Multi-tenant Support**: Each tenant can have their own FBR configuration
2. **Security**: FBR tokens are stored securely in database, not in code
3. **Flexibility**: Settings can be changed without redeploying the application
4. **Isolation**: One tenant's FBR settings don't affect others
5. **Scalability**: Easy to add more FBR-related settings in the future

## Backward Compatibility

- Environment variables are still used as fallback values
- Existing functionality remains unchanged if no tenant settings are configured
- Order creation process remains the same from user perspective

## Security Considerations

- FBR tokens are stored as password fields in the UI
- Database access is protected by tenant context validation
- All API endpoints require valid tenant authentication
- Settings are isolated per tenant with database-level constraints

## Troubleshooting

### Common Issues

1. **Migration Fails**
   - Ensure database connection is working
   - Check if `tenants` table exists
   - Verify user has ALTER table permissions

2. **Settings Not Saving**
   - Check browser console for API errors
   - Verify tenant authentication is working
   - Ensure all required fields are filled

3. **Order Form Not Auto-filling**
   - Verify FBR settings are saved in Settings page
   - Check `/api/seller-info` response in browser dev tools
   - Ensure tenant context is being passed correctly

### Debug Steps

1. Check browser console for JavaScript errors
2. Verify API responses in Network tab
3. Check server logs for database errors
4. Confirm tenant ID is being passed in requests

## Future Enhancements

Potential improvements that could be added:

1. **Settings Import/Export**: Allow bulk import of settings
2. **Settings History**: Track changes to FBR settings
3. **Validation Rules**: Add more sophisticated validation
4. **Environment Override**: Allow environment variables to override database settings
5. **Settings Templates**: Provide common FBR configuration templates
