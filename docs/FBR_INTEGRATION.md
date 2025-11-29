# FBR Digital Invoicing Integration

This document explains how to use the FBR Digital Invoicing integration in your Next.js application.

## Overview

The FBR integration automatically submits digital invoices to Pakistan's Federal Board of Revenue (FBR) when orders are created. It supports all major FBR scenarios and handles the complete validation → submission flow.

## Quick Start

### 1. Environment Setup

Copy the variables from `fbr-env-template.txt` to your `.env.local` file:

```bash
# FBR API Configuration
FBR_BASE_URL=https://sandbox-api.fbr.gov.pk/di_data/v1/di
FBR_SANDBOX_TOKEN=your_fbr_sandbox_token_here

# Your Business Information
FBR_SELLER_NTNCNIC=1234567890123
FBR_SELLER_BUSINESS_NAME=Your Business Name
FBR_SELLER_PROVINCE=Punjab
FBR_SELLER_ADDRESS=Your Business Address, City, Province
```

### 2. Test Your Setup

Visit `/api/fbr/test?type=setup` to verify your configuration:

```bash
curl http://localhost:3000/api/fbr/test?type=setup
```

### 3. Create Orders with FBR Data

When creating orders through `/orders/add`, include these FBR-specific fields:

- `scenarioId`: FBR scenario (e.g., "SN026")
- `invoiceType`: "Sale Invoice" or "Debit Note"
- `buyerRegistrationType`: "Registered" or "Unregistered"
- `buyerNTNCNIC`: Required for registered buyers
- Items should have `hsCode` and `uom` fields

## Architecture

### Library Structure

```
lib/fbr/
├── types.ts          # TypeScript definitions
├── saleTypes.ts      # Scenario mappings
├── client.ts         # Server-only API calls
├── mapper.ts         # Order → FBR conversion
├── test.ts           # Testing utilities
└── index.ts          # Main exports
```

### API Endpoints

- `POST /api/fbr/submit` - Submit invoice to FBR
- `GET /api/fbr/test` - Test utilities and diagnostics

### Integration Points

1. **Order Creation** (`/app/api/orders/route.ts`)
   - Automatically triggers FBR submission when `scenarioId` is provided
   - Stores FBR response in order record
   - Continues order creation even if FBR fails

2. **Frontend** (`/app/orders/add/page.tsx`)
   - Shows FBR success/failure feedback
   - Logs results to console

## Supported Scenarios

| Scenario | Description | Special Handling |
|----------|-------------|------------------|
| SN001-004 | Standard rate goods | Default 18% tax |
| SN002 | With withholding tax | Requires `salesTaxWithheldAtSource` |
| SN005 | Reduced rate | 1% tax rate |
| SN006 | Exempt goods | 0% tax, no sales tax |
| SN007 | Zero-rate goods | 0% tax, no sales tax |
| SN008 | 3rd Schedule | Supports `fixedNotifiedValueOrRetailPrice` |
| SN017-018 | FED in ST mode | Requires `fedPayable` |
| SN026-028 | Retail supplies | Standard handling |

## Field Mapping

Our internal order fields are automatically mapped to FBR's required field names:

| Our Field | FBR Field | Notes |
|-----------|-----------|-------|
| `email` | Used for unregistered buyer | |
| `scenarioId` | `scenarioId` | Required for FBR submission |
| `invoiceType` | `invoiceType` | "Sale Invoice" or "Debit Note" |
| `buyerNTNCNIC` | `buyerNTNCNIC` | Required for registered buyers |
| `productName` | `productDescription` | |
| `hsCode` | `hsCode` | Harmonized System Code |
| `uom` | `uoM` | Unit of Measurement |
| `taxPercentage` | `rate` | Converted to percentage string |

## Testing

### Test Endpoints

```bash
# Test configuration
GET /api/fbr/test?type=setup

# Test specific scenario validation
GET /api/fbr/test?type=validation&scenario=SN026

# Test complete flow (validate + post)
GET /api/fbr/test?type=flow&scenario=SN002

# Test all scenarios
GET /api/fbr/test?type=all-scenarios

# Generate test data
GET /api/fbr/test?type=generate-data&scenario=SN008
```

### Sample Test Data

```javascript
// Test SN026 (Standard goods)
const testOrder = {
  email: 'test@example.com',
  scenarioId: 'SN026',
  subtotal: 1000,
  totalAmount: 1180,
  buyerRegistrationType: 'Unregistered',
  items: [{
    productName: 'Test Product',
    hsCode: '1234567890',
    uom: 'PCS',
    quantity: 1,
    price: 1000,
    totalPrice: 1000,
    taxPercentage: 18
  }]
};
```

## Error Handling

The integration is designed to be resilient:

1. **Configuration Errors**: Logged and skipped gracefully
2. **FBR API Errors**: Stored in order record for debugging
3. **Validation Failures**: Detailed error messages provided
4. **Network Issues**: Order creation continues, FBR marked as failed

### Common Issues

1. **"Configuration invalid"**
   - Check environment variables are set
   - Verify FBR token is valid

2. **"Validation failed"**
   - Check HS codes are 8-10 digits
   - Ensure UOM matches FBR reference data
   - Verify buyer information for registered customers

3. **"Connection failed"**
   - Check FBR_BASE_URL is correct
   - Verify network connectivity
   - Confirm FBR sandbox is accessible

## Production Deployment

### Environment Variables

```bash
# Production FBR API
FBR_BASE_URL=https://api.fbr.gov.pk/di_data/v1/di
FBR_PRODUCTION_TOKEN=your_production_token

# Your registered business details
FBR_SELLER_NTNCNIC=your_actual_ntn_cnic
FBR_SELLER_BUSINESS_NAME=Your Registered Business Name
FBR_SELLER_PROVINCE=Your Province
FBR_SELLER_ADDRESS=Your Registered Address
```

### Security Considerations

1. **Server-Only**: FBR tokens never sent to browser
2. **Environment Variables**: Store sensitive data in environment
3. **Error Logging**: Don't expose FBR tokens in logs
4. **Rate Limiting**: Consider implementing rate limits for API calls

### Monitoring

Monitor these metrics in production:

- FBR submission success rate
- Average response times
- Common validation errors
- Failed scenario types

## Advanced Usage

### Custom Seller Information

```typescript
import { mapOrderToFbrInvoice } from '@/lib/fbr';

const customSeller = {
  ntncnic: 'custom_ntn',
  businessName: 'Custom Business',
  province: 'Sindh',
  address: 'Custom Address'
};

const fbrInvoice = await mapOrderToFbrInvoice(order, customSeller);
```

### Direct FBR Submission

```typescript
import { validateInvoice, postInvoice } from '@/lib/fbr';

// Validate first
const validation = await validateInvoice(fbrInvoice);
if (validation.validationResponse?.status === 'Valid') {
  // Then post
  const result = await postInvoice(fbrInvoice);
}
```

### Custom Scenario Handling

```typescript
import { requiresWithholdingTax, supportsThirdSchedule } from '@/lib/fbr';

if (requiresWithholdingTax(scenarioId)) {
  // Add withholding tax logic
}

if (supportsThirdSchedule(scenarioId)) {
  // Handle 3rd schedule pricing
}
```

## Support

For issues with the integration:

1. Check the test endpoints for diagnostics
2. Review console logs for detailed error messages
3. Verify your order data matches expected format
4. Test with known working scenarios first

For FBR-specific issues:
- Contact FBR support for API access issues
- Verify your business registration status
- Check FBR documentation for field requirements
