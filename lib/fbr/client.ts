/**
 * FBR Digital Invoicing Client
 * 
 * Server-only API client for FBR Digital Invoicing integration.
 * This module handles all communication with FBR's sandbox and production APIs.
 * 
 * IMPORTANT: This module should NEVER be imported on the client side.
 * The FBR token must remain server-only for security.
 */

import type { FbrInvoice, FbrValidationResponse, FbrPostResponse } from './types';

/**
 * Check if FBR post response indicates success
 * @param resp FBR post response
 * @returns true if the post was successful
 */
function isPostSuccess(resp: FbrPostResponse): boolean {
  const v = resp?.validationResponse;
  const headerValid = (v?.status === "Valid" || v?.statusCode === "00");
  const lineValid = (v?.invoiceStatuses || []).every(s => s.status === "Valid" || s.statusCode === "00");
  return Boolean(resp?.invoiceNumber) && headerValid && lineValid;
}

/**
 * Get FBR settings from tenant database
 * @param tenantId The tenant ID to get settings for
 * @returns FBR settings object with baseUrl and token
 */
async function getTenantFbrSettings(tenantId: string): Promise<{ baseUrl?: string; token?: string }> {
  try {
    const { db } = await import('@/lib/db');
    const { settings } = await import('@/lib/schema');
    const { eq, and } = await import('drizzle-orm');
    
    const fbrSettings = await db
      .select()
      .from(settings)
      .where(
        and(
          eq(settings.tenantId, tenantId),
          eq(settings.isActive, true)
        )
      );

    let baseUrl = '';
    let token = '';

    for (const setting of fbrSettings) {
      if (setting.key === 'fbr_base_url' || setting.key === 'FBR_BASE_URL') {
        baseUrl = setting.value || '';
      } else if (setting.key === 'fbr_sandbox_token' || setting.key === 'FBR_SANDBOX_TOKEN') {
        token = setting.value || '';
      }
    }

    return { baseUrl, token };
  } catch (error) {
    console.warn('Error fetching tenant FBR settings:', error);
    return {};
  }
}

// Environment variables - these can be overridden by tenant settings
const BASE_URL = process.env.FBR_BASE_URL;
const TOKEN = process.env.FBR_SANDBOX_TOKEN;

if (!BASE_URL || !TOKEN) {
  console.warn('⚠️  FBR environment variables not configured. Will use tenant-specific settings if available.');
}

/**
 * Get headers for FBR API requests
 * @param customToken Optional custom token to use instead of environment variable
 */
function getHeaders(customToken?: string): HeadersInit {
  const token = customToken || TOKEN;
  
  if (!token) {
    throw new Error('FBR token is not configured (neither custom token nor FBR_SANDBOX_TOKEN environment variable)');
  }
  
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Sanitize JSON text by fixing common malformed patterns from FBR API
 * FBR sometimes returns invalid JSON with missing values or trailing commas
 * 
 * @param jsonText The raw JSON text to sanitize
 * @returns Cleaned JSON text that can be parsed
 */
function sanitizeJsonText(jsonText: string): string {
  return jsonText
    .replace(/:\s*,/g, ': null,')           // Fix missing values: "key":, -> "key": null,
    .replace(/,(\s*[}\]])/g, '$1')          // Remove trailing commas before } or ]
    .replace(/,(\s*,)/g, ',');              // Remove duplicate commas
}

/**
 * Sanitize object by removing empty strings, null, and undefined values
 * This is crucial for FBR API as it doesn't accept empty string numerics
 * Keep zero values for numeric fields as FBR expects them
 * 
 * @param obj The object to sanitize
 * @param isPreview Whether this is for preview (preserves display fields) or FBR submission
 * @returns Sanitized object with empty values removed
 */
export function sanitize(obj: any, isPreview: boolean = false): any {
  if (Array.isArray(obj)) {
    return obj.map(item => sanitize(item, isPreview));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    
    // Numeric fields that should be included even if zero
    let numericFields = [
      'discount', 'fedPayable', 'extraTax', 'furtherTax', 
      'salesTaxWithheldAtSource', 'fixedNotifiedValueOrRetailPrice',
      'totalValues', 'valueSalesExcludingST', 'salesTaxApplicable', 'quantity'
    ];
    
    // Add display fields for preview mode
    if (isPreview) {
      numericFields = [...numericFields, 'priceIncludingTax', 'priceExcludingTax', 'taxPercentage'];
    }
    
    // String fields that should be included even if empty string (FBR expects them)
    const requiredStringFields = [
      'invoiceRefNo', 'sroScheduleNo', 'sroItemSerialNo'
    ];
    
    for (const [key, value] of Object.entries(obj)) {
      // Skip null and undefined, but keep empty strings for required fields
      if (value === null || typeof value === 'undefined') {
        continue;
      }
      
      // For numeric fields, include zero values
      if (numericFields.includes(key) && typeof value === 'number') {
        sanitized[key] = value;
      }
      // For required string fields, include even if empty
      else if (requiredStringFields.includes(key) && typeof value === 'string') {
        sanitized[key] = value;
      }
      // For other fields, skip if empty string
      else if (value !== '') {
        sanitized[key] = sanitize(value, isPreview);
      }
    }
    
    return sanitized;
  }
  
  return obj;
}

/**
 * Validate invoice data with FBR
 * 
 * @param payload The FBR invoice payload
 * @param customToken Optional custom token to use instead of environment variable
 * @param tenantId Optional tenant ID to get tenant-specific FBR settings
 * @returns Validation response from FBR
 */
export async function validateInvoice(payload: FbrInvoice, customToken?: string, tenantId?: string, customBaseUrl?: string, isProductionMode?: boolean): Promise<FbrValidationResponse> {
  let baseUrl = customBaseUrl || BASE_URL;
  let token = customToken || TOKEN;

  // Try to get tenant-specific settings if tenantId is provided
  if (tenantId) {
    const tenantSettings = await getTenantFbrSettings(tenantId);
    if (tenantSettings.baseUrl && !customBaseUrl) {
      baseUrl = tenantSettings.baseUrl;
    }
    if (tenantSettings.token && !customToken) {
      token = tenantSettings.token;
    }
  }

  // Auto-switch to production base URL if production mode is enabled
  if (isProductionMode && baseUrl && !customBaseUrl) {
    // Convert sandbox URL to production URL
    if (baseUrl.includes('sandbox.fbr.gov.pk')) {
      baseUrl = baseUrl.replace('sandbox.fbr.gov.pk/api', 'gw.fbr.gov.pk');
      console.log('🚨 Production mode: Switched base URL to', baseUrl);
    }
  }

  if (!baseUrl) {
    throw new Error('FBR_BASE_URL environment variable is not configured and no tenant-specific base URL found');
  }
  
  if (!token) {
    throw new Error('FBR token is not configured (neither environment variable nor tenant-specific token found)');
  }
  
  try {
    const sanitizedPayload = sanitize(payload, false); // false for FBR submission (removes display fields)
    
    console.log('🔍 Validating invoice with FBR:', {
      invoiceType: sanitizedPayload.invoiceType,
      scenarioId: sanitizedPayload.scenarioId,
      itemCount: sanitizedPayload.items?.length || 0,
      isProductionMode: isProductionMode || false,
    });
    
    // Use production endpoint if production mode is enabled
    const endpoint = isProductionMode ? 'validateinvoicedata' : 'validateinvoicedata_sb';
    const response = await fetch(`${baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(sanitizedPayload),
    });
    
    // Get raw response text first to handle malformed JSON
    const responseText = await response.text();
    
    let result;
    try {
      // Clean up malformed JSON from FBR API
      const cleanedResponseText = sanitizeJsonText(responseText);
      result = JSON.parse(cleanedResponseText);
    } catch (jsonError) {
      console.error('❌ FBR returned invalid JSON:', {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
        jsonError: jsonError instanceof Error ? jsonError.message : String(jsonError)
      });
      throw new Error(`FBR API returned invalid JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
    }
    
    if (!response.ok) {
      console.error('❌ FBR validation failed:', {
        status: response.status,
        statusText: response.statusText,
        result,
        isProductionMode: isProductionMode || false,
        endpoint: `${baseUrl}/${endpoint}`
      });
    } else {
      console.log('✅ FBR validation response:', {
        status: result.validationResponse?.status,
        hasError: !!result.validationResponse?.error,
        isProductionMode: isProductionMode || false,
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error validating invoice with FBR:', error);
    throw new Error(`Failed to validate invoice: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Post invoice data to FBR after successful validation
 * 
 * @param payload The FBR invoice payload (should be pre-validated)
 * @param customToken Optional custom token to use instead of environment variable
 * @param tenantId Optional tenant ID to get tenant-specific FBR settings
 * @returns Post response from FBR
 */
export async function postInvoice(payload: FbrInvoice, customToken?: string, tenantId?: string, customBaseUrl?: string, isProductionMode?: boolean): Promise<FbrPostResponse> {
  let baseUrl = customBaseUrl || BASE_URL;
  let token = customToken || TOKEN;

  // Try to get tenant-specific settings if tenantId is provided
  if (tenantId) {
    const tenantSettings = await getTenantFbrSettings(tenantId);
    if (tenantSettings.baseUrl && !customBaseUrl) {
      baseUrl = tenantSettings.baseUrl;
    }
    if (tenantSettings.token && !customToken) {
      token = tenantSettings.token;
    }
  }

  // Auto-switch to production base URL if production mode is enabled
  if (isProductionMode && baseUrl && !customBaseUrl) {
    // Convert sandbox URL to production URL
    if (baseUrl.includes('sandbox.fbr.gov.pk')) {
      baseUrl = baseUrl.replace('sandbox.fbr.gov.pk/api', 'gw.fbr.gov.pk');
      console.log('🚨 Production mode: Switched base URL to', baseUrl);
    }
  }

  if (!baseUrl) {
    throw new Error('FBR_BASE_URL environment variable is not configured and no tenant-specific base URL found');
  }
  
  if (!token) {
    throw new Error('FBR token is not configured (neither environment variable nor tenant-specific token found)');
  }
  
  try {
    const sanitizedPayload = sanitize(payload, false); // false for FBR submission (removes display fields)
    
    console.log('📤 Posting invoice to FBR:', {
      invoiceType: sanitizedPayload.invoiceType,
      scenarioId: sanitizedPayload.scenarioId,
      itemCount: sanitizedPayload.items?.length || 0,
      isProductionMode: isProductionMode || false,
    });
    
    // Use production endpoint if production mode is enabled
    const endpoint = isProductionMode ? 'postinvoicedata' : 'postinvoicedata_sb';
    const response = await fetch(`${baseUrl}/${endpoint}`, {
      method: 'POST',
      headers: getHeaders(token),
      body: JSON.stringify(sanitizedPayload),
    });
    
    // Get raw response text first to handle malformed JSON
    const responseText = await response.text();
    
    let result;
    try {
      // Clean up malformed JSON from FBR API
      const cleanedResponseText = sanitizeJsonText(responseText);
      result = JSON.parse(cleanedResponseText);
    } catch (jsonError) {
      console.error('❌ FBR returned invalid JSON:', {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
        jsonError: jsonError instanceof Error ? jsonError.message : String(jsonError)
      });
      throw new Error(`FBR API returned invalid JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
    }
    
    if (!response.ok) {
      console.error('❌ FBR post HTTP failed:', {
        status: response.status,
        statusText: response.statusText,
        result,
        isProductionMode: isProductionMode || false,
        endpoint: `${baseUrl}/${endpoint}`
      });
      
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        invoiceNumber: result.invoiceNumber,
        validationResponse: result.validationResponse,
        ...result
      };
    }

    // Check if the post was actually successful using proper FBR response structure
    const success = isPostSuccess(result);
    
    if (success) {
      console.log('✅ FBR post successful:', {
        success: true,
        invoiceNumber: result.invoiceNumber,
        validationStatus: result.validationResponse?.status,
        statusCode: result.validationResponse?.statusCode,
        isProductionMode: isProductionMode || false,
      });
    } else {
      console.error('❌ FBR post validation failed:', {
        success: false,
        invoiceNumber: result.invoiceNumber,
        validationStatus: result.validationResponse?.status,
        statusCode: result.validationResponse?.statusCode,
        error: result.validationResponse?.error,
        isProductionMode: isProductionMode || false,
      });
    }
    
    return {
      success,
      invoiceNumber: result.invoiceNumber,
      message: result.validationResponse?.error || (success ? 'Invoice posted successfully' : 'Post validation failed'),
      validationResponse: result.validationResponse,
      ...result
    };
  } catch (error) {
    console.error('❌ Error posting invoice to FBR:', error);
    throw new Error(`Failed to post invoice: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Optional: Get canonical saleType text from FBR's SaleTypeToRate endpoint
 * This can be used to verify our local mapping against FBR's current data
 * 
 * @param date Date in YYYY-MM-DD format
 * @returns SaleTypeToRate response or null if failed
 */
export async function getSaleTypeToRate(date: string): Promise<any | null> {
  if (!BASE_URL || !TOKEN) {
    console.warn('⚠️  Cannot fetch SaleTypeToRate: FBR environment variables not configured');
    return null;
  }
  
  try {
    // Construct the SaleTypeToRate endpoint URL
    const baseWithoutDi = BASE_URL.replace('/di_data/v1/di', '');
    const url = `${baseWithoutDi}/pdi/v2/SaleTypeToRate?date=${date}&transTypeId=18&originationSupplier=1`;
    
    console.log('📊 Fetching SaleTypeToRate from FBR for date:', date);
    
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${TOKEN}` 
      },
    });
    
    if (!response.ok) {
      console.warn('⚠️  SaleTypeToRate request failed:', response.status, response.statusText);
      return null;
    }
    
    const result = await response.json();
    console.log('✅ SaleTypeToRate fetched successfully');
    
    return result;
  } catch (error) {
    console.warn('⚠️  Error fetching SaleTypeToRate:', error);
    return null;
  }
}

/**
 * Validate environment configuration
 * Call this during app startup to ensure FBR integration is properly configured
 */
export function validateFbrConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!BASE_URL) {
    errors.push('FBR_BASE_URL environment variable is not set');
  }
  
  if (!TOKEN) {
    errors.push('FBR_SANDBOX_TOKEN environment variable is not set');
  }
  
  // Basic URL validation
  if (BASE_URL && !BASE_URL.startsWith('http')) {
    errors.push('FBR_BASE_URL must be a valid HTTP/HTTPS URL');
  }
  
  // Basic token validation (should be a non-empty string)
  if (TOKEN && TOKEN.trim().length === 0) {
    errors.push('FBR_SANDBOX_TOKEN cannot be empty');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Test FBR connection with a minimal request
 * This can be used for health checks or configuration validation
 */
export async function testFbrConnection(): Promise<{ success: boolean; error?: string }> {
  try {
    const config = validateFbrConfig();
    if (!config.isValid) {
      return {
        success: false,
        error: `Configuration invalid: ${config.errors.join(', ')}`,
      };
    }
    
    // Try to fetch SaleTypeToRate as a connection test
    const today = new Date().toISOString().split('T')[0];
    const result = await getSaleTypeToRate(today);
    
    return {
      success: result !== null,
      error: result === null ? 'Failed to connect to FBR API' : undefined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
