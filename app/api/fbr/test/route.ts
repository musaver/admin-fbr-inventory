/**
 * FBR Test API Endpoint
 * 
 * This endpoint provides various test utilities for the FBR integration.
 * Use this to verify your setup and test different scenarios.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  testFbrSetup,
  testFbrValidation,
  testFbrFlow,
  testOrderMapping,
  testAllScenarios,
  generateTestData,
} from '@/lib/fbr/test';
import type { ScenarioId } from '@/lib/fbr/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const testType = searchParams.get('type') || 'setup';
    const scenario = (searchParams.get('scenario') || 'SN026') as ScenarioId;
    
    switch (testType) {
      case 'setup':
        // Test FBR configuration and connection
        const setupResult = await testFbrSetup();
        return NextResponse.json({
          test: 'setup',
          ...setupResult,
        });
        
      case 'validation':
        // Test FBR validation with a specific scenario
        const validationResult = await testFbrValidation(scenario);
        return NextResponse.json({
          test: 'validation',
          scenario,
          ...validationResult,
        });
        
      case 'flow':
        // Test complete FBR flow (validate + post)
        const flowResult = await testFbrFlow(scenario);
        return NextResponse.json({
          test: 'flow',
          scenario,
          ...flowResult,
        });
        
      case 'mapping':
        // Test order to FBR mapping
        const mappingResult = testOrderMapping();
        return NextResponse.json({
          test: 'mapping',
          ...mappingResult,
        });
        
      case 'all-scenarios':
        // Test all scenarios with basic validation
        const allScenariosResult = await testAllScenarios();
        return NextResponse.json({
          test: 'all-scenarios',
          ...allScenariosResult,
        });
        
      case 'generate-data':
        // Generate test data for a specific scenario
        const testData = generateTestData(scenario);
        return NextResponse.json({
          test: 'generate-data',
          scenario,
          data: testData,
        });
        
      default:
        return NextResponse.json({
          error: 'Invalid test type',
          availableTests: {
            'setup': 'Test FBR configuration and connection',
            'validation': 'Test FBR validation with a scenario (specify ?scenario=SN026)',
            'flow': 'Test complete FBR flow (validate + post)',
            'mapping': 'Test order to FBR mapping',
            'all-scenarios': 'Test all scenarios with basic validation',
            'generate-data': 'Generate test data for a scenario',
          },
          usage: {
            'Test setup': '/api/fbr/test?type=setup',
            'Test SN026 validation': '/api/fbr/test?type=validation&scenario=SN026',
            'Test SN002 flow': '/api/fbr/test?type=flow&scenario=SN002',
            'Test mapping': '/api/fbr/test?type=mapping',
            'Test all scenarios': '/api/fbr/test?type=all-scenarios',
            'Generate SN008 data': '/api/fbr/test?type=generate-data&scenario=SN008',
          },
        }, { status: 400 });
    }
    
  } catch (error) {
    console.error('❌ FBR test endpoint error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { testType, scenario, orderData } = body;
    
    if (testType === 'custom-order' && orderData) {
      // Test with custom order data
      const { validateOrderForFbr, mapOrderToFbrInvoice } = await import('@/lib/fbr/mapper');
      const { validateInvoice } = await import('@/lib/fbr/client');
      
      // Validate order structure
      const validation = validateOrderForFbr(orderData);
      if (!validation.isValid) {
        return NextResponse.json({
          success: false,
          step: 'order-validation',
          errors: validation.errors,
        }, { status: 400 });
      }
      
      // Map to FBR format
      const fbrInvoice = await mapOrderToFbrInvoice(orderData);
      
      // Validate with FBR
      const fbrValidation = await validateInvoice(fbrInvoice);
      
      return NextResponse.json({
        success: fbrValidation.validationResponse?.status === 'Valid',
        orderValidation: validation,
        fbrInvoice,
        fbrValidation,
      });
    }
    
    return NextResponse.json({
      error: 'Invalid POST request',
      supportedActions: {
        'custom-order': 'Test with custom order data (provide orderData in body)',
      },
    }, { status: 400 });
    
  } catch (error) {
    console.error('❌ FBR test POST error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
