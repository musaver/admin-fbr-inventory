# PKR Default Currency Update

## Overview

Updated the application to use Pakistani Rupees (PKR) as the default currency instead of USD (US Dollar). This change affects both new tenant registration and existing currency handling throughout the system.

## Changes Made

### 1. Tenant Registration Default
**File**: `app/api/tenants/register/route.ts`
- Changed default currency in tenant settings from `'USD'` to `'PKR'`
- New tenants will now be created with PKR as their default currency

### 2. Tenant Settings Helper
**File**: `lib/tenant.ts`
- Updated `getTenantSettings()` function to return PKR as default currency instead of USD
- This affects fallback behavior when tenant settings are not properly configured

### 3. Currency API Enhancement
**File**: `app/api/settings/currency/route.ts`
- Made the currency API tenant-aware (previously was global)
- Now each tenant can have their own currency setting stored in the database
- Added tenant context validation to both GET and POST endpoints
- Updated database queries to include `tenant_id` for proper isolation

### 4. Existing Defaults (Already Correct)
The following were already set to PKR and remain unchanged:
- **Currency Context**: `app/contexts/CurrencyContext.tsx` - Default state was already PKR
- **Currency API**: Default currency constant was already PKR

## Impact

### For New Tenants
- All newly registered tenants will default to PKR currency
- No manual currency change needed after registration

### For Existing Tenants
- **MIGRATION REQUIRED**: Existing tenants need to be updated to PKR
- Run the migration script to update all existing tenants to PKR
- Currency settings are now properly isolated per tenant
- Each tenant can independently change their currency through Settings page

### For Currency Display
- PKR symbol (₨) will be displayed by default for new tenants
- Currency formatting will use Pakistani Rupee format

## Technical Details

### Database Changes
The currency setting is now stored per tenant in the `settings` table:
- **Key**: `selected_currency`
- **Value**: `PKR` (default)
- **Tenant Isolation**: Each tenant has their own currency setting

### API Changes
- `GET /api/settings/currency` - Now requires tenant authentication
- `POST /api/settings/currency` - Now saves currency per tenant
- Proper tenant context validation added to both endpoints

### Backward Compatibility
- Existing functionality remains unchanged from user perspective
- Environment variables can still be used as fallbacks
- No breaking changes to existing currency display logic

## Migration Instructions

### Step 1: Apply Database Migration for Existing Tenants

**Option A: Using Shell Script (Recommended)**
```bash
# Make script executable (if not already done)
chmod +x scripts/update-all-tenants-to-pkr.sh

# Run the migration
./scripts/update-all-tenants-to-pkr.sh
```

**Option B: Using Node.js Script**
```bash
# Install mysql2 if not already installed
npm install mysql2

# Run the migration
node scripts/update-tenants-to-pkr.js
```

**Option C: Manual SQL Execution**
```bash
# Apply the SQL migration directly
mysql -u username -p database_name < migrations/update-all-tenants-currency-to-pkr.sql
```

### Step 2: Restart Application
After running the migration, restart your Next.js application to ensure all changes take effect.

## Testing

To verify the changes:

1. **Existing Tenant Verification**:
   - Login to any existing tenant
   - Check that PKR (₨) is now the default currency
   - Verify order forms and product pages show ₨ symbol
   - Test Settings page currency selection works

2. **New Tenant Registration**:
   - Register a new tenant
   - Confirm PKR is set as default currency
   - Verify all currency displays use ₨ symbol

3. **Multi-tenant Currency Isolation**:
   - Login to different tenants
   - Change currency in Settings for one tenant
   - Verify other tenants are unaffected
   - Confirm each tenant maintains independent currency settings

## Benefits

1. **Localized Default**: PKR is more appropriate for Pakistani market
2. **Tenant Isolation**: Each tenant can have independent currency settings
3. **Better UX**: No need to manually change currency after registration
4. **Proper Multi-tenancy**: Currency settings are now fully tenant-aware

## Future Considerations

- Consider adding more regional currencies (INR, BDT, etc.)
- Add currency conversion features if needed
- Implement currency-based tax calculations
- Add regional formatting preferences
