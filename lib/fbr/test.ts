/**
 * FBR Integration Test Script
 * 
 * This script provides utilities to test the FBR integration
 * with various scenarios and sample data.
 * 
 * Usage:
 * - Run in a server environment (API route or server action)
 * - Never run on the client side (contains sensitive API calls)
 */

import { createTestFbrInvoice, validateOrderForFbr, mapOrderToFbrInvoice } from './mapper';
import { validateInvoice, postInvoice, testFbrConnection, validateFbrConfig } from './client';
import type { Order, ScenarioId } from './types';

/**
 * Test FBR configuration and connection
 */
export async function testFbrSetup() {
  console.log('🔧 Testing FBR Configuration...');
  
  const config = validateFbrConfig();
  console.log('Configuration:', config);
  
  if (!config.isValid) {
    return {
      success: false,
      error: 'Configuration invalid',
      details: config.errors,
    };
  }
  
  console.log('📡 Testing FBR Connection...');
  const connection = await testFbrConnection();
  console.log('Connection:', connection);
  
  return {
    success: config.isValid && connection.success,
    configuration: config,
    connection,
  };
}

/**
 * Test FBR invoice validation with sample data
 */
export async function testFbrValidation(scenarioId: ScenarioId = 'SN026') {
  console.log(`🧪 Testing FBR validation with scenario ${scenarioId}...`);
  
  try {
    // Create test invoice
    const testInvoice = await createTestFbrInvoice(scenarioId);
    console.log('Test invoice created:', {
      scenarioId: testInvoice.scenarioId,
      invoiceType: testInvoice.invoiceType,
      buyerType: testInvoice.buyerRegistrationType,
      itemCount: testInvoice.items.length,
    });
    
    // Validate with FBR
    const validation = await validateInvoice(testInvoice);
    console.log('Validation result:', {
      status: validation.validationResponse?.status,
      hasError: !!validation.validationResponse?.error,
    });
    
    return {
      success: validation.validationResponse?.status === 'Valid',
      invoice: testInvoice,
      validation,
    };
  } catch (error) {
    console.error('❌ Test validation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test complete FBR flow (validate + post)
 */
export async function testFbrFlow(scenarioId: ScenarioId = 'SN026') {
  console.log(`🚀 Testing complete FBR flow with scenario ${scenarioId}...`);
  
  try {
    // Create test invoice
    const testInvoice = await createTestFbrInvoice(scenarioId);
    
    // Step 1: Validate
    console.log('Step 1: Validating invoice...');
    const validation = await validateInvoice(testInvoice);
    
    if (validation.validationResponse?.status !== 'Valid') {
      return {
        success: false,
        step: 'validation',
        invoice: testInvoice,
        validation,
        error: validation.validationResponse?.error || 'Validation failed',
      };
    }
    
    // Step 2: Post
    console.log('Step 2: Posting invoice...');
    const post = await postInvoice(testInvoice);
    
    return {
      success: true,
      invoice: testInvoice,
      validation,
      post,
    };
  } catch (error) {
    console.error('❌ Test flow failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Test order to FBR mapping
 */
export function testOrderMapping() {
  console.log('🗺️ Testing order to FBR mapping...');
  
  const testOrder: Order = {
    email: 'test@example.com',
    scenarioId: 'SN026',
    invoiceType: 'Sale Invoice',
    subtotal: 1000,
    totalAmount: 1180,
    taxAmount: 180,
    currency: 'PKR',
    buyerRegistrationType: 'Unregistered',
    billingFirstName: 'John',
    billingLastName: 'Doe',
    billingAddress1: '123 Test Street',
    billingCity: 'Lahore',
    billingState: 'Punjab',
    billingCountry: 'Pakistan',
    items: [
      {
        productId: 'test-1',
        productName: 'Test Product',
        productDescription: 'A test product for FBR integration',
        hsCode: '1234567890',
        uom: 'PCS',
        quantity: 2,
        price: 500,
        totalPrice: 1000,
        taxPercentage: 18,
        taxAmount: 180,
      },
    ],
  };
  
  // Validate order
  const validation = validateOrderForFbr(testOrder);
  console.log('Order validation:', validation);
  
  if (!validation.isValid) {
    return {
      success: false,
      errors: validation.errors,
      order: testOrder,
    };
  }
  
  return {
    success: true,
    order: testOrder,
    validation,
  };
}

/**
 * Test all scenarios with basic validation
 */
export async function testAllScenarios() {
  console.log('🎯 Testing all FBR scenarios...');
  
  const scenarios: ScenarioId[] = [
    'SN001', 'SN002', 'SN005', 'SN006', 'SN007', 'SN008',
    'SN017', 'SN026', 'SN027', 'SN028'
  ];
  
  const results = [];
  
  for (const scenario of scenarios) {
    console.log(`Testing scenario ${scenario}...`);
    
    try {
      const testInvoice = await createTestFbrInvoice(scenario);
      const validation = await validateInvoice(testInvoice);
      
      results.push({
        scenario,
        success: validation.validationResponse?.status === 'Valid',
        saleType: testInvoice.items[0]?.saleType,
        status: validation.validationResponse?.status,
        error: validation.validationResponse?.error,
      });
    } catch (error) {
      results.push({
        scenario,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`✅ ${successCount}/${results.length} scenarios passed validation`);
  
  return {
    totalScenarios: results.length,
    successCount,
    results,
  };
}

/**
 * Generate test data for different scenarios
 */
export function generateTestData(scenarioId: ScenarioId) {
  const baseOrder: Order = {
    email: 'test@example.com',
    scenarioId,
    invoiceType: 'Sale Invoice',
    subtotal: 1000,
    totalAmount: 1180,
    taxAmount: 180,
    currency: 'PKR',
    buyerRegistrationType: 'Unregistered',
    billingFirstName: 'John',
    billingLastName: 'Doe',
    billingAddress1: '123 Test Street',
    billingCity: 'Lahore',
    billingState: 'Punjab',
    billingCountry: 'Pakistan',
    items: [],
  };
  
  // Scenario-specific modifications
  switch (scenarioId) {
    case 'SN002': // Withholding tax
      baseOrder.items = [
        {
          productId: 'test-wht',
          productName: 'Product with Withholding Tax',
          hsCode: '1234567890',
          uom: 'PCS',
          quantity: 1,
          price: 1000,
          totalPrice: 1000,
          taxPercentage: 18,
          extraTax: 20, // 2% withholding tax
        },
      ];
      break;
      
    case 'SN005': // Reduced rate
      baseOrder.totalAmount = 1010;
      baseOrder.taxAmount = 10;
      baseOrder.items = [
        {
          productId: 'test-reduced',
          productName: 'Reduced Rate Product',
          hsCode: '1234567890',
          uom: 'PCS',
          quantity: 1,
          price: 1000,
          totalPrice: 1000,
          taxPercentage: 1,
        },
      ];
      break;
      
    case 'SN006': // Exempt
      baseOrder.totalAmount = 1000;
      baseOrder.taxAmount = 0;
      baseOrder.items = [
        {
          productId: 'test-exempt',
          productName: 'Exempt Product',
          hsCode: '1234567890',
          uom: 'PCS',
          quantity: 1,
          price: 1000,
          totalPrice: 1000,
          taxPercentage: 0,
        },
      ];
      break;
      
    case 'SN008': // 3rd Schedule
      baseOrder.items = [
        {
          productId: 'test-3rd-schedule',
          productName: '3rd Schedule Product',
          hsCode: '1234567890',
          uom: 'PCS',
          quantity: 1,
          price: 1000,
          totalPrice: 1000,
          taxPercentage: 18,
          fixedNotifiedValueOrRetailPrice: 1200,
        },
      ];
      break;
      
    case 'SN017': // FED in ST mode
      baseOrder.items = [
        {
          productId: 'test-fed',
          productName: 'FED Product',
          hsCode: '1234567890',
          uom: 'PCS',
          quantity: 1,
          price: 1000,
          totalPrice: 1000,
          taxPercentage: 18,
          fedPayableTax: 50,
        },
      ];
      break;
      
    default: // Standard scenarios
      baseOrder.items = [
        {
          productId: 'test-standard',
          productName: 'Standard Product',
          hsCode: '1234567890',
          uom: 'PCS',
          quantity: 1,
          price: 1000,
          totalPrice: 1000,
          taxPercentage: 18,
        },
      ];
  }
  
  return baseOrder;
}
